import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import App from "./App";
import { api } from "./api";
import { teachingExamples, applyExample } from "./examples";
import { initialTeacher } from "./components/Intake";
import { Comparison, ProgramCard } from "./components/ProgramDetails";
import { normal } from "./test/fixtures";
import fixture from "../../artifacts/stage4_1/offline-fixtures.json";
import type { Recommendation } from "./types";
const provided = fixture.cases.provided.response as unknown as Recommendation;
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
    .mockResolvedValue(structuredClone(normal));
  vi.mocked(api.journey).mockReset();
});
it.each(teachingExamples)(
  "loads $title into actual editable intake without inference or consent",
  async (example) => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      screen.getByRole("button", { name: `Load ${example.title} example` }),
    );
    expect(
      screen.getByLabelText(String(example.grade), { selector: "input" }),
    ).toBeChecked();
    expect(
      screen.getByRole("spinbutton", { name: /Number of students/ }),
    ).toHaveValue(example.students);
    expect(screen.getByRole("textbox", { name: /Learning goal/ })).toHaveValue(
      example.goal,
    );
    expect(
      screen.getByRole("textbox", { name: /Subject or topic interests/ }),
    ).toHaveValue(example.topics.join(","));
    expect(
      screen.getByRole("spinbutton", { name: "Maximum program-fee budget" }),
    ).toHaveValue(example.budget);
    expect(
      screen.getByRole("spinbutton", { name: "Maximum workshop duration" }),
    ).toHaveValue(90);
    expect(
      screen.getByRole("checkbox", { name: /I accept the USD/ }),
    ).not.toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent(
      "filled in and editable",
    );
    expect(api.recommend).not.toHaveBeenCalled();
    expect(api.journey).not.toHaveBeenCalled();
  },
);
it("replaces preset fields predictably and requires renewed USD acknowledgment", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    screen.getByRole("button", { name: "Load Explore Force & Motion example" }),
  );
  await user.click(screen.getByRole("checkbox", { name: /I accept the USD/ }));
  await user.click(
    screen.getByRole("button", {
      name: "Load Discover Sustainable Energy example",
    }),
  );
  expect(screen.getByLabelText("4", { selector: "input" })).not.toBeChecked();
  expect(screen.getByLabelText("5", { selector: "input" })).toBeChecked();
  expect(
    screen.getByRole("checkbox", { name: /I accept the USD/ }),
  ).not.toBeChecked();
  await user.click(screen.getByRole("button", { name: /Discover Programs/ }));
  expect(screen.getByRole("alert")).toHaveTextContent(/USD/);
  expect(api.recommend).not.toHaveBeenCalled();
});
it("submits current edits only after deliberate validation and consent", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    screen.getByRole("button", { name: "Load Explore Force & Motion example" }),
  );
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Maximum program-fee budget" }),
    { target: { value: "380" } },
  );
  fireEvent.change(
    screen.getByRole("spinbutton", { name: "Maximum workshop duration" }),
    { target: { value: "75" } },
  );
  await user.click(screen.getByLabelText("3", { selector: "input" }));
  await user.click(screen.getByRole("checkbox", { name: /I accept the USD/ }));
  await user.click(screen.getByRole("button", { name: /Discover Programs/ }));
  await screen.findByText("Find your class’s next discovery.");
  expect(api.recommend).toHaveBeenCalledWith(
    expect.objectContaining({
      grades: [4, 3],
      student_count: 24,
      max_program_fee: 380,
      budget_currency: "USD",
      assume_usd: true,
      max_duration_minutes: 75,
      preferences: [
        "Force and motion",
        "engineering design",
        "experimentation",
      ],
    }),
  );
  expect(api.recommend).toHaveBeenCalledTimes(1);
  expect(api.journey).not.toHaveBeenCalled();
});
it("clears example limits and goal to the ordinary starting state", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    screen.getByRole("button", {
      name: "Load Geometry Through Creative Design example",
    }),
  );
  await user.click(screen.getByRole("button", { name: "Clear example" }));
  expect(
    screen.getByRole("spinbutton", { name: "Maximum program-fee budget" }),
  ).toHaveValue(null);
  expect(
    screen.getByRole("spinbutton", { name: "Maximum workshop duration" }),
  ).toHaveValue(null);
  expect(screen.getByRole("textbox", { name: /Learning goal/ })).toHaveValue(
    "",
  );
  expect(api.recommend).not.toHaveBeenCalled();
});
it("allows optional preset limits to be cleared without silently reinstating them", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    screen.getByRole("button", { name: "Load Explore Force & Motion example" }),
  );
  for (const name of [
    "Maximum program-fee budget",
    "Maximum workshop duration",
  ])
    fireEvent.change(screen.getByRole("spinbutton", { name }), {
      target: { value: "" },
    });
  await user.click(screen.getByRole("button", { name: /Discover Programs/ }));
  await screen.findByText("Find your class’s next discovery.");
  expect(api.recommend).toHaveBeenCalledWith(
    expect.objectContaining({
      max_program_fee: null,
      budget_currency: null,
      max_duration_minutes: null,
      assume_usd: false,
    }),
  );
});
it("never silently removes advanced mandatory requirements when switching examples", () => {
  const teacher = {
    ...structuredClone(initialTeacher),
    required_standards: ["test standard"],
    mandatory_operational: {
      capacity: true,
      accessibility: "step-free access",
    },
    assume_usd: true,
  };
  const result = applyExample(teacher, teachingExamples[1]);
  expect(result.required_standards).toEqual(["test standard"]);
  expect(result.mandatory_operational).toEqual(teacher.mandatory_operational);
  expect(result.assume_usd).toBe(false);
  expect(teacher.assume_usd).toBe(true);
});
it("supports keyboard activation of Quick Start without submitting", async () => {
  const user = userEvent.setup();
  render(<App />);
  screen
    .getByRole("button", { name: "Load Explore Force & Motion example" })
    .focus();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("status")).toHaveTextContent(
    "Explore Force & Motion loaded",
  );
  expect(api.recommend).not.toHaveBeenCalled();
});
it("exposes a compact step control while keeping later workflow steps disabled", async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
  expect(
    screen.getByRole("progressbar", { name: "Planning progress" }),
  ).toHaveAttribute("value", "1");
  const toggle = screen.getByRole("button", { name: "Show steps" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  await user.click(toggle);
  expect(screen.getByRole("button", { name: "Hide steps" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  const navigation = screen.getByRole("navigation", { name: "Planning steps" });
  for (const name of [
    /Discover & Compare/,
    /Your Selection/,
    /Learning Journey/,
    /Review & Export/,
  ])
    expect(within(navigation).getByRole("button", { name })).toBeDisabled();
  expect(api.recommend).not.toHaveBeenCalled();
});
it("keeps main facts and an official link outside collapsed additional source details", () => {
  const c = provided.recommendations[0];
  render(
    <ProgramCard
      candidate={c}
      index={0}
      selectedForCompare={false}
      onCompare={() => {}}
      onSelect={() => {}}
    />,
  );
  const details = screen
    .getByText("Additional Source Details")
    .closest("details")!;
  expect(details).not.toHaveAttribute("open");
  expect(
    screen
      .getAllByRole("link", { name: "Official museum program page ↗" })
      .some((a) => !a.closest("details")),
  ).toBe(true);
  expect(screen.getByText("USD 336.00").closest("details")).toBeNull();
  expect(screen.getByText("90 minutes").closest("details")).toBeNull();
  expect(screen.getByText(/USD assumed/).closest("details")).toBeNull();
});
it.each(["ewm-rubber-band-car", "ewm-bridges"])(
  "keeps %s mandatory missing duration out of collapsed metadata",
  (pid) => {
    const c = provided.provisional_options.find((c) => c.program_id === pid)!;
    render(
      <ProgramCard
        candidate={c}
        index={0}
        selectedForCompare={false}
        onCompare={() => {}}
        onSelect={() => {}}
      />,
    );
    expect(
      screen.getByText("Needs Confirmation").closest("details"),
    ).toBeNull();
    expect(
      screen
        .getByText(
          /Workshop duration is not published or has not been verified/,
        )
        .closest("details"),
    ).toBeNull();
  },
);
it("retains mandatory capacity uncertainty prominently", () => {
  const c = structuredClone(provided.recommendations[0]);
  c.category = "provisional";
  c.eligibility.eligibility_status = "unknown";
  c.eligibility.hard_constraints.push({
    constraint: "operational:capacity",
    status: "unknown",
    reason: "Requires museum confirmation",
  });
  render(
    <ProgramCard
      candidate={c}
      index={0}
      selectedForCompare={false}
      onCompare={() => {}}
      onSelect={() => {}}
    />,
  );
  expect(
    screen
      .getByText("Class capacity: museum confirmation is required.")
      .closest("details"),
  ).toBeNull();
});
it("presents mobile comparison by attribute with the same factual values and explicit selection", async () => {
  const onSelect = vi.fn();
  const candidates = [
    ...provided.recommendations,
    ...provided.provisional_options,
  ];
  render(<Comparison candidates={candidates} onSelect={onSelect} />);
  const region = screen.getByRole("region", {
    name: "Program comparison by attribute",
  });
  expect(
    within(region).getByRole("heading", { name: "Class program fee" }),
  ).toBeInTheDocument();
  expect(within(region).getAllByText("Not published")).toHaveLength(2);
  expect(within(region).getAllByText("USD 336.00").length).toBeGreaterThan(0);
  await userEvent.click(
    within(region).getByRole("button", { name: "Select Catapult" }),
  );
  expect(onSelect).toHaveBeenCalledWith(candidates[0]);
  expect(api.journey).not.toHaveBeenCalled();
});

it("clears a stale consent error on acknowledgment without starting inference", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    screen.getByRole("button", { name: "Load Explore Force & Motion example" }),
  );
  await user.click(screen.getByRole("button", { name: /Discover Programs/ }));
  expect(screen.getByRole("alert")).toHaveTextContent("USD");
  await user.click(screen.getByRole("checkbox", { name: /I accept the USD/ }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(api.recommend).not.toHaveBeenCalled();
});
