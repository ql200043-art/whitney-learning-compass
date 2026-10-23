import {
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import App from "./App";
import { api } from "./api";
import {
  SourceContent,
  ProgramCard,
  ConfirmationSections,
} from "./components/ProgramDetails";
import CatalogChecks from "./components/CatalogChecks";
import { sourceSummary, constraintExplanation } from "./evidence";
import type { Recommendation, Journey, Teacher } from "./types";
import data from "../../artifacts/stage4_1/offline-fixtures.json";
const cases = data.cases as unknown as Record<
  string,
  { request: Teacher; response: Recommendation }
>;
const journey = data.journey as unknown as Journey;
vi.mock("./api", async (original) => ({
  ...(await original<typeof import("./api")>()),
  api: {
    health: vi.fn(),
    catalog: vi.fn(),
    recommend: vi.fn(),
    journey: vi.fn(),
    activity: vi.fn(),
  },
}));
beforeEach(() => {
  vi.mocked(api.health).mockResolvedValue({ status: "ok" });
  vi.mocked(api.catalog).mockResolvedValue({ programs: [] });
  vi.mocked(api.recommend)
    .mockReset()
    .mockResolvedValue(structuredClone(cases.provided.response));
  vi.mocked(api.journey)
    .mockReset()
    .mockResolvedValue(structuredClone(journey));
});
const budget = () =>
  screen.getByRole("spinbutton", { name: "Maximum program-fee budget" });
const time = () =>
  screen.getByRole("spinbutton", { name: "Maximum workshop duration" });
async function intake() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    screen.getByRole("button", { name: "Use force & motion example" }),
  );
  return user;
}
async function submit() {
  await userEvent.click(
    screen.getByRole("button", { name: /Discover Programs/ }),
  );
  await screen.findByText("Find your class’s next discovery.");
}
async function constrained() {
  const user = await intake();
  fireEvent.change(budget(), { target: { value: "400" } });
  fireEvent.change(time(), { target: { value: "90" } });
  await user.click(screen.getByRole("checkbox", { name: /I accept the USD/ }));
  await submit();
  return user;
}
it("shows explicit examples while keeping optional inputs genuinely empty", async () => {
  await intake();
  expect(budget()).toHaveValue(null);
  expect(time()).toHaveValue(null);
  expect(budget()).toHaveAttribute("placeholder", "e.g., 400");
  expect(time()).toHaveAttribute("placeholder", "e.g., 90");
  expect(budget()).toHaveAccessibleDescription(
    "Leave blank if you have no maximum budget.",
  );
  expect(time()).toHaveAccessibleDescription(
    "Leave blank if your workshop time is flexible.",
  );
});
it("submits entered 400 USD and 90 minutes and reflects actual limits and $336", async () => {
  await constrained();
  expect(api.recommend).toHaveBeenCalledWith(
    expect.objectContaining({
      grades: [4],
      student_count: 24,
      max_program_fee: 400,
      budget_currency: "USD",
      assume_usd: true,
      max_duration_minutes: 90,
    }),
  );
  expect(document.querySelector(".request-strip")).toHaveTextContent(
    "USD 400 program-fee budget · 90 minutes maximum",
  );
  const card = screen
    .getAllByRole("heading", { name: "Catapult", level: 3 })
    .map((h) => h.closest("article"))
    .find(Boolean)!;
  expect(card).toHaveTextContent("USD 336.00");
  expect(card).toHaveTextContent("Program Requirements Met");
});
it("submits deliberately blank limits as null without adopting placeholders", async () => {
  vi.mocked(api.recommend).mockResolvedValue(cases.blank.response);
  await intake();
  await submit();
  expect(api.recommend).toHaveBeenCalledWith(
    expect.objectContaining({
      max_program_fee: null,
      budget_currency: null,
      assume_usd: false,
      max_duration_minutes: null,
    }),
  );
  expect(document.querySelector(".request-strip")).toHaveTextContent(
    "No maximum program-fee budget specified · No maximum workshop duration specified",
  );
});
it("submits the latest edited limits rather than earlier values", async () => {
  await intake();
  for (const [b, t] of [
    [400, 90],
    [600, 120],
  ]) {
    fireEvent.change(budget(), { target: { value: String(b) } });
    fireEvent.change(time(), { target: { value: String(t) } });
  }
  await userEvent.click(
    screen.getByRole("checkbox", { name: /I accept the USD/ }),
  );
  vi.mocked(api.recommend).mockResolvedValue(cases.edited.response);
  await submit();
  expect(api.recommend).toHaveBeenCalledWith(
    expect.objectContaining({
      max_program_fee: 600,
      max_duration_minutes: 120,
    }),
  );
  expect(document.querySelector(".request-strip")).toHaveTextContent(
    "USD 600 program-fee budget · 120 minutes maximum",
  );
});
it("clearing previously entered limits removes the constraints", async () => {
  await intake();
  for (const [b, t] of [
    ["400", "90"],
    ["", ""],
  ]) {
    fireEvent.change(budget(), { target: { value: b } });
    fireEvent.change(time(), { target: { value: t } });
  }
  await submit();
  expect(api.recommend).toHaveBeenCalledWith(
    expect.objectContaining({
      max_program_fee: null,
      budget_currency: null,
      max_duration_minutes: null,
    }),
  );
});
it.each(["Rubber Band Car", "Bridges"])(
  "keeps %s provisional with a required duration",
  async (name) => {
    await constrained();
    const card = screen
      .getAllByRole("heading", { name, level: 3 })
      .map((h) => h.closest("article"))
      .find(Boolean)!;
    expect(card).toHaveTextContent("Needs Confirmation");
    expect(card).not.toHaveTextContent("Program Requirements Met");
    expect(card).toHaveTextContent("Not published");
    expect(card).toHaveTextContent("time-constrained visit");
  },
);
it.each(["Rubber Band Car", "Bridges"])(
  "keeps unpublished duration visible for eligible %s without a time limit",
  (name) => {
    const candidate = cases.blank.response.recommendations.find(
      (c) => c.museum_facts.official_name === name,
    )!;
    render(
      <ProgramCard
        candidate={candidate}
        index={0}
        selectedForCompare={false}
        onCompare={() => {}}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("Program Requirements Met")).toBeInTheDocument();
    expect(screen.getByText("Not published")).toBeInTheDocument();
    expect(
      screen.getByText(/Please confirm the length with the museum/),
    ).toBeInTheDocument();
  },
);
it("has no raw identifiers in expanded teacher evidence and retains source hyperlinks", () => {
  render(<SourceContent facts={journey.museum_facts} printable />);
  expect(document.body.textContent).not.toMatch(
    /grade_levels|program_page|normalized|\/description|\/subjects|\/duration|source_id|Keep null/,
  );
  expect(screen.getByText(/Verified source information/)).toHaveTextContent(
    "program description (factual summary), published grades, subjects, workshop fee, duration",
  );
  expect(
    screen.getByRole("link", { name: journey.museum_facts.official_url }),
  ).toHaveAttribute("href", journey.museum_facts.official_url);
  expect(screen.getByText(/Source review:/)).toHaveTextContent("2026-10-21");
});
it("excludes missing duration from verified source fields", () => {
  const facts = cases.provided.response.provisional_options[0].museum_facts;
  expect(sourceSummary(facts)).not.toContain("duration");
  render(<SourceContent facts={facts} />);
  expect(
    screen.getByText(/Not published. Please confirm the length/),
  ).toBeInTheDocument();
});
it("does not present conflicting evidence as verified even if a value exists", () => {
  const facts = structuredClone(journey.museum_facts);
  facts.field_evidence["/duration/minutes"] = {
    source_id: "program_page",
    status: "conflicting",
  };
  expect(sourceSummary(facts)).not.toContain("duration");
  facts.field_evidence["/subjects"].source_id = "missing-source";
  expect(sourceSummary(facts)).not.toContain("subjects");
});
it("keeps catalog checks collapsed, grouped and progressively expandable without dropping programs", async () => {
  render(
    <CatalogChecks matches={cases.provided.response.eligibility_results} />,
  );
  const details = screen
    .getByText("How were programs checked?")
    .closest("details")!;
  expect(details).not.toHaveAttribute("open");
  await userEvent.click(
    within(details).getByText("How were programs checked?"),
  );
  for (const summary of details.querySelectorAll(".check-group > summary"))
    fireEvent.click(summary);
  for (const button of screen.queryAllByRole("button", { name: /Show all/ }))
    await userEvent.click(button);
  expect(details.querySelectorAll(".check-row")).toHaveLength(20);
  expect(details.textContent).not.toMatch(
    /grade:4|program_page|program_fee_budget|— pass|— unknown/,
  );
  expect(details.textContent).toContain("Programs not meeting requirements");
});
it("uses plain-language grade checks without changing their status", () => {
  for (const status of ["pass", "fail", "unknown"] as const) {
    const c = { constraint: "grade:4", status, reason: "test" };
    const explanation = constraintExplanation(c);
    expect(explanation).toContain("Grade 4");
    expect(explanation).not.toContain("grade:");
    expect(c.status).toBe(status);
  }
});
it("keeps source date notes and supplied-ball safety in their correct sections", () => {
  render(
    <>
      <ConfirmationSections
        facts={journey.museum_facts}
        match={journey.eligibility}
        teacher={cases.provided.request}
        safety={journey.safety_notice}
      />
      <SourceContent facts={journey.museum_facts} />
    </>,
  );
  const safety = screen
    .getByRole("heading", { name: "Safety & Important Notes" })
    .closest("section")!;
  expect(safety).toHaveTextContent("supplied ping-pong ball");
  expect(safety).not.toHaveTextContent("2026-10-21");
  expect(document.querySelector(".source-content")).not.toHaveTextContent(
    "ping-pong",
  );
  expect(document.body.textContent?.match(/Source review:/g)).toHaveLength(1);
});
it("uses consistent English navigation labels", async () => {
  await intake();
  for (const name of [
    "Teaching Goal",
    "Discover & Compare",
    "Your Selection",
    "Learning Journey",
    "Review & Export",
  ])
    expect(
      screen.getByRole("button", { name: new RegExp(name) }),
    ).toBeInTheDocument();
});
it("distinguishes untouched, reviewed, edited and reverted suggestions without further inference", async () => {
  const user = await constrained();
  const card = screen
    .getAllByRole("heading", { name: "Catapult", level: 3 })
    .map((h) => h.closest("article"))
    .find(Boolean)!;
  await user.click(
    within(card).getByRole("button", { name: "Select This Program" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Generate Learning Journey" }),
  );
  await screen.findByText("AI-Generated Teaching Suggestions");
  expect(
    screen.queryByText("Teacher-Edited Teaching Suggestions"),
  ).not.toBeInTheDocument();
  expect(document.querySelector(".program-overview")).toHaveTextContent(
    "USD 400 program-fee budget · 90 minutes maximum",
  );
  await user.click(screen.getByRole("checkbox", { name: /I have reviewed/ }));
  expect(screen.getByText("Reviewed by Teacher")).toBeInTheDocument();
  expect(
    screen.getByText("AI-Generated Teaching Suggestions"),
  ).toBeInTheDocument();
  const input = screen.getByRole("textbox", {
    name: "BEFORE Learning objectives 1",
  });
  fireEvent.change(input, { target: { value: "Teacher revised objective" } });
  expect(
    screen.getByText("Teacher-Edited Teaching Suggestions"),
  ).toBeInTheDocument();
  expect(screen.queryByText("Reviewed by Teacher")).not.toBeInTheDocument();
  fireEvent.change(input, {
    target: {
      value: journey.ai_teaching_suggestions.before.learning_objectives[0],
    },
  });
  expect(
    screen.getByText("AI-Generated Teaching Suggestions"),
  ).toBeInTheDocument();
  await waitFor(() => expect(api.journey).toHaveBeenCalledTimes(1));
  expect(api.recommend).toHaveBeenCalledTimes(1);
});

it("prints operational questions once while keeping source limitations in Sources", () => {
  render(<SourceContent facts={journey.museum_facts} printable />);
  expect(document.body.textContent).not.toMatch(
    /Minimum class size:|Class capacity:|Accessibility arrangements:|Booking availability:/,
  );
  expect(document.body.textContent).toContain("Currency code:");
  expect(document.body.textContent).toContain("Museum page update date:");
});
