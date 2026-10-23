import {
  render,
  screen,
  within,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import { api, ApiError } from "./api";
import { normal, journey, provisional, noMatch } from "./test/fixtures";
vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>();
  return {
    ...actual,
    api: {
      health: vi.fn(),
      catalog: vi.fn(),
      recommend: vi.fn(),
      journey: vi.fn(),
      activity: vi.fn(),
    },
  };
});
beforeEach(() => {
  vi.mocked(api.health).mockResolvedValue({ status: "ok" });
  vi.mocked(api.catalog).mockResolvedValue({
    programs: normal.recommendations.map((c) => c.museum_facts),
  });
  vi.mocked(api.recommend)
    .mockReset()
    .mockResolvedValue({
      ...structuredClone(normal),
      workflow_token: "private-test-capability",
    });
  vi.mocked(api.journey)
    .mockReset()
    .mockResolvedValue(structuredClone(journey));
});
async function discover() {
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    screen.getByRole("button", { name: "Use force & motion example" }),
  );
  await user.type(
    screen.getByRole("spinbutton", { name: "Maximum program-fee budget" }),
    "400",
  );
  await user.click(screen.getByRole("checkbox", { name: /I accept the USD/ }));
  await user.type(
    screen.getByRole("spinbutton", { name: /Maximum workshop duration/ }),
    "90",
  );
  await user.click(screen.getByRole("button", { name: /Discover Programs/ }));
  await screen.findByText("Find your class’s next discovery.");
  return user;
}
async function selectCatapult() {
  const user = await discover();
  const card = screen
    .getAllByRole("heading", { name: "Catapult", level: 3 })
    .map((h) => h.closest("article"))
    .find(Boolean)!;
  await user.click(
    within(card).getByRole("button", { name: "Select This Program" }),
  );
  return user;
}
async function design() {
  const user = await selectCatapult();
  await user.click(
    screen.getByRole("button", { name: "Generate Learning Journey" }),
  );
  await screen.findByText("A journey beyond the workshop");
  return user;
}
it("shows branding and validates intake without model calls", async () => {
  const user = userEvent.setup();
  render(<App />);
  expect(
    screen.getByText("From Curriculum Goals to Hands-On Discovery"),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Discover Programs/ }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Describe a learning goal",
  );
  expect(api.recommend).not.toHaveBeenCalled();
});
it("supports a mixed-grade class and exposes assumptions", async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByLabelText("3", { selector: "input" }));
  await user.click(
    screen.getByRole("button", { name: "Use force & motion example" }),
  );
  await user.click(screen.getByRole("button", { name: /Discover Programs/ }));
  await waitFor(() => expect(api.recommend).toHaveBeenCalled());
  expect(vi.mocked(api.recommend).mock.calls[0][0].grades).toEqual([4, 3]);
});
it("renders factual cards, three-way comparison, and waits for explicit selection", async () => {
  const user = await discover();
  expect(screen.getAllByText("USD 336.00")).toHaveLength(3);
  expect(api.journey).not.toHaveBeenCalled();
  await user.click(
    screen.getByRole("button", { name: "Compare Programs (3)" }),
  );
  expect(screen.getByRole("table")).toBeInTheDocument();
  expect(
    within(screen.getByRole("table")).getAllByRole("columnheader"),
  ).toHaveLength(4);
  expect(api.recommend).toHaveBeenCalledTimes(1);
  expect(api.journey).not.toHaveBeenCalled();
});
it("requires a second deliberate action after selecting a real program", async () => {
  const user = await selectCatapult();
  expect(
    screen.getByText("A moment to review your selection."),
  ).toBeInTheDocument();
  expect(api.journey).not.toHaveBeenCalled();
  await user.click(
    screen.getByRole("button", { name: "Generate Learning Journey" }),
  );
  await screen.findByText("A journey beyond the workshop");
  expect(api.journey).toHaveBeenCalledWith(
    normal.workflow_id,
    "ewm-catapult",
    false,
    "private-test-capability",
  );
});
it("requires acknowledgment for provisional selection", async () => {
  vi.mocked(api.recommend).mockResolvedValue({
    ...structuredClone(provisional),
    workflow_token: "private-test-capability",
  });
  const user = await discover();
  await user.click(screen.getByRole("button", { name: "Select This Program" }));
  expect(
    screen.getByRole("button", { name: "Generate Learning Journey" }),
  ).toBeDisabled();
  await user.click(
    screen.getByRole("checkbox", { name: /I acknowledge the unresolved/ }),
  );
  expect(
    screen.getByRole("button", { name: "Generate Learning Journey" }),
  ).toBeEnabled();
  await user.click(
    screen.getByRole("button", { name: "Generate Learning Journey" }),
  );
  await waitFor(() =>
    expect(api.journey).toHaveBeenCalledWith(
      provisional.workflow_id,
      "ewm-bridges",
      true,
      "private-test-capability",
    ),
  );
});
it("shows no-match results with actual failures and no selection", async () => {
  vi.mocked(api.recommend).mockResolvedValue(structuredClone(noMatch));
  await discover();
  expect(
    screen.getByText("No suitable recommendation was returned."),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Select This Program" }),
  ).not.toBeInTheDocument();
  await userEvent.click(screen.getByText("How were programs checked?"));
  await userEvent.click(
    screen.getByText("Programs not meeting requirements (20)"),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Show all 20 programs in this group" }),
  );
  expect(document.querySelectorAll(".check-row")).toHaveLength(20);
});
it("renders all phases, allows edits that persist through review, and keeps facts read-only", async () => {
  const user = await design();
  for (const name of [
    "Prepare & Wonder",
    "Explore & Observe",
    "Reflect & Extend",
  ])
    expect(screen.getByRole("heading", { name })).toBeInTheDocument();
  const field = screen.getByRole("textbox", {
    name: "BEFORE Learning objectives 1",
  });
  await user.clear(field);
  await user.type(field, "Explain motion using an actual observation.");
  await user.click(screen.getByRole("button", { name: "Review & Export" }));
  expect(
    screen.getByText("Explain motion using an actual observation."),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Teacher-Edited Teaching Suggestions"),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Return to Editing" }));
  expect(
    screen.getByRole("textbox", { name: "BEFORE Learning objectives 1" }),
  ).toHaveValue("Explain motion using an actual observation.");
  expect(
    screen.queryByRole("textbox", { name: "Published fee" }),
  ).not.toBeInTheDocument();
  expect(api.journey).toHaveBeenCalledTimes(1);
  expect(api.recommend).toHaveBeenCalledTimes(1);
});
it("separates safety, booking questions, and sources; prints without new inference", async () => {
  const user = await design();
  const safety = screen
    .getByRole("heading", { name: "Safety & Important Notes" })
    .closest("section")!;
  expect(safety).toHaveTextContent("supplied ping-pong ball");
  const questions = screen
    .getByRole("heading", { name: "Questions to Confirm with the Museum" })
    .closest("section")!;
  expect(questions).not.toHaveTextContent("ping-pong");
  expect(questions).toHaveTextContent("Can you accommodate our class of 24");
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  await user.click(screen.getByRole("button", { name: "Print / Save as PDF" }));
  expect(print).toHaveBeenCalledOnce();
  expect(api.journey).toHaveBeenCalledTimes(1);
});
it("creates an editable copy-only inquiry and leaves observations blank", async () => {
  const user = await design();
  expect(
    screen.getByRole("textbox", {
      name: "Teacher notes and actual observations",
    }),
  ).toHaveValue("");
  const field = screen.getByRole("textbox", { name: "Museum inquiry draft" });
  expect((field as HTMLTextAreaElement).value).toContain("Catapult");
  await user.type(field, "\nPlease let us know.");
  const clipboard = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockResolvedValue();
  await user.click(screen.getByRole("button", { name: "Copy Inquiry Draft" }));
  expect(clipboard).toHaveBeenCalledWith(
    expect.stringContaining("Please let us know."),
  );
  expect(screen.getByRole("status")).toHaveTextContent("Nothing has been sent");
  expect(api.journey).toHaveBeenCalledTimes(1);
});
it("does not expose capabilities in DOM or persistent browser storage", async () => {
  await design();
  expect(document.body.textContent).not.toContain("private-test-capability");
  expect(document.documentElement.outerHTML).not.toContain(
    "private-test-capability",
  );
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
  expect(location.href).not.toContain("capability");
});
it("handles expired workflow and preserves a restart path", async () => {
  const user = await selectCatapult();
  vi.mocked(api.journey).mockRejectedValue(new ApiError("workflow_not_found"));
  await user.click(
    screen.getByRole("button", { name: "Generate Learning Journey" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("expired");
  await user.click(
    screen.getByRole("button", { name: "Return to requirements / new search" }),
  );
  expect(
    (
      screen.getByRole("textbox", {
        name: /Learning goal/,
      }) as HTMLTextAreaElement
    ).value,
  ).toContain("force");
  expect(api.recommend).toHaveBeenCalledTimes(1);
});
it("prevents duplicate recommendations during a pending call", async () => {
  let finish!: (r: typeof normal) => void;
  vi.mocked(api.recommend).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    screen.getByRole("button", { name: "Use force & motion example" }),
  );
  const form = screen.getByRole("form", { name: "Teacher requirements" });
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(api.recommend).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("status")).toHaveTextContent("Finding connections");
  finish(normal);
  await screen.findByText("Find your class’s next discovery.");
});
it("handles backend unavailability without starting inference", async () => {
  vi.mocked(api.health).mockRejectedValue(new ApiError("network"));
  render(<App />);
  expect(
    await screen.findByText("Local service unavailable"),
  ).toBeInTheDocument();
  expect(api.recommend).not.toHaveBeenCalled();
});
it("prevents duplicate Designer submissions while a request is pending", async () => {
  const user = await selectCatapult();
  let finish!: (r: typeof journey) => void;
  vi.mocked(api.journey).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const button = screen.getByRole("button", {
    name: "Generate Learning Journey",
  });
  await user.dblClick(button);
  expect(api.journey).toHaveBeenCalledTimes(1);
  expect(button).toBeDisabled();
  finish(journey);
  await screen.findByText("A journey beyond the workshop");
});
it("does not allow a second program selection to start another plan in a consumed workflow", async () => {
  const user = await design();
  await user.click(screen.getByRole("button", { name: /Discover & Compare/ }));
  await user.click(
    screen.getAllByRole("button", { name: "Select This Program" })[0],
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "already has a learning plan",
  );
  expect(api.journey).toHaveBeenCalledTimes(1);
});
it("displays a controlled provider error without leaking an upstream body", async () => {
  vi.mocked(api.recommend).mockRejectedValue(
    new ApiError("missing_configuration"),
  );
  const user = userEvent.setup();
  render(<App />);
  await user.click(
    screen.getByRole("button", { name: "Use force & motion example" }),
  );
  await user.click(screen.getByRole("button", { name: /Discover Programs/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "server-side course key",
  );
  expect(
    screen.queryByText("Find your class’s next discovery."),
  ).not.toBeInTheDocument();
});
