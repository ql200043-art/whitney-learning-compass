import offline from "../../artifacts/stage4_1/offline-fixtures.json";
import { journey, request } from "./test/fixtures";
import type { Journey } from "./types";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import App from "./App";
import { api } from "./api";
import { DRAFT_KEY, readDraft, serializeDraft, snapshotProgram } from "./draftStorage";
import { savedDraft } from "./test/draftFixture";
vi.mock("./api", () => ({ api: { health: vi.fn(), catalog: vi.fn(), recommend: vi.fn(), journey: vi.fn(), activity: vi.fn() }, errorMessage: () => "Service unavailable" }));
beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.health).mockRejectedValue(Error("offline"));
    vi.mocked(api.catalog).mockRejectedValue(Error("offline"));
});
function seed() { const d = savedDraft(); d.edited.before.learning_objectives[0] = "Saved objective"; d.edited.during.evidence_collection[0] = "Saved evidence prompt"; d.notes = "Teacher's saved notes"; localStorage.setItem(DRAFT_KEY, serializeDraft(d)); return d; }
async function restore() { seed(); render(<App />); fireEvent.click(screen.getByRole("button", { name: "Restore Draft" })); await screen.findByText("Saved Draft — Not Revalidated"); }
it("offers recovery without automatically replacing intake or calling agents", async () => {
    seed();
    render(<App />);
    await screen.findByText("You have a saved learning plan");
    expect(screen.queryByText("Saved Draft — Not Revalidated")).not.toBeInTheDocument();
    expect(api.recommend).not.toHaveBeenCalled();
    expect(api.journey).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Start Fresh" }));
    expect(screen.queryByText("You have a saved learning plan")).not.toBeInTheDocument();
    expect(readDraft().draft).not.toBeNull();
});
it("restores offline editing, history, safe navigation and source links without authorization", async () => {
    await restore();
    expect(screen.getByLabelText("BEFORE Learning objectives 1")).toHaveValue("Saved objective");
    expect(screen.getByLabelText("DURING Evidence collection 1")).toHaveValue("Saved evidence prompt");
    expect(screen.getByLabelText("Teacher notes and actual observations")).toHaveValue("Teacher's saved notes");
    expect(screen.getByText(/At generation:.*historical/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Official museum program page/ })).toHaveAttribute("href", savedDraft().program.url);
    expect(screen.queryByRole("button", { name: "Load latest activity" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Generate Learning Journey" })).not.toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Planning steps" });
    expect(within(nav).getAllByRole("button")).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("BEFORE Learning objectives 1"), { target: { value: "Recovered edit" } });
    fireEvent.change(screen.getByLabelText("Museum inquiry draft"), { target: { value: "New local inquiry" } });
    await waitFor(() => expect(readDraft().draft?.edited.before.learning_objectives[0]).toBe("Recovered edit"));
    expect(readDraft().draft?.inquiry).toBe("New local inquiry");
    expect(api.recommend).not.toHaveBeenCalled();
    expect(api.journey).not.toHaveBeenCalled();
});
it("preserves edits through review and prints a restored plan locally", async () => {
    await restore();
    const print = vi.spyOn(window, "print").mockImplementation(() => { });
    fireEvent.change(screen.getByLabelText("AFTER Follow-up classroom activity"), { target: { value: "Retained follow-up" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Review & Export" }).at(-1)!);
    expect(screen.getByText("Retained follow-up")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Print / Save as PDF" }));
    expect(print).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Saved Draft — Not Revalidated").closest("section")).not.toHaveClass("no-print");
    fireEvent.click(screen.getByRole("button", { name: "Return to Editing" }));
    expect(screen.getByLabelText("AFTER Follow-up classroom activity")).toHaveValue("Retained follow-up");
    expect(api.journey).not.toHaveBeenCalled();
});
it("requires deletion confirmation; cancellation leaves saved content intact", async () => {
    await restore();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Delete Saved Draft" }));
    expect(window.confirm).toHaveBeenCalled();
    expect(readDraft().draft).not.toBeNull();
});
it("deletes only saved copy, pauses pending autosave, and does not offer recovery after remount", async () => {
    seed();
    const view = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Restore Draft" }));
    fireEvent.change(screen.getByLabelText("BEFORE Learning objectives 1"), { target: { value: "Pending edit" } });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Delete Saved Draft" }));
    expect(screen.getByLabelText("BEFORE Learning objectives 1")).toHaveValue("Pending edit");
    expect(screen.getByText(/Saved copy deleted. Your open plan remains/)).toBeInTheDocument();
    fireEvent(window, new Event("pagehide"));
    expect(readDraft().draft).toBeNull();
    view.unmount();
    render(<App />);
    expect(screen.queryByRole("button", { name: "Restore Draft" })).not.toBeInTheDocument();
    expect(api.journey).not.toHaveBeenCalled();
});
it("starts a normal new intake without restoring fake completed server steps", async () => {
    await restore();
    fireEvent.click(screen.getByRole("button", { name: "Start New Plan" }));
    expect(screen.getByRole("button", { name: /Discover Programs/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Discover & Compare/ })).toBeDisabled();
    expect(api.recommend).not.toHaveBeenCalled();
});
it("renders HTML-like saved text as text, never executable content", async () => {
    const d = seed();
    d.edited.before.learning_objectives[0] = '<img src=x onerror="alert(1)">';
    localStorage.setItem(DRAFT_KEY, serializeDraft(d));
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Restore Draft" }));
    expect(screen.getByLabelText("BEFORE Learning objectives 1")).toHaveValue(d.edited.before.learning_objectives[0]);
    expect(document.querySelector('img[src="x"]')).toBeNull();
});
it.each(['{broken', JSON.stringify({ schema_version: 999 })])("shows a safe recoverability error for damaged storage", raw => {
    localStorage.setItem(DRAFT_KEY, raw);
    render(<App />);
    expect(screen.getByText("Your saved draft is unavailable")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Restore Draft" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start Fresh" }));
    expect(screen.getByRole("button", { name: /Discover Programs/ })).toBeInTheDocument();
});
it("keeps recovery failures readable when storage access is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw Error("private exception"); });
    render(<App />);
    expect(screen.getByText(/Browser storage is unavailable/)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("private exception");
});
it("shows another-tab conflict and requires explicit replacement choice", async () => {
    await restore();
    const other = savedDraft();
    other.notes = "Other tab edit";
    localStorage.setItem(DRAFT_KEY, serializeDraft(other));
    fireEvent(window, new StorageEvent("storage", { key: DRAFT_KEY, newValue: serializeDraft(other) }));
    expect(screen.getByText(/changed in another tab/)).toBeInTheDocument();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Replace Saved Draft" }));
    expect(readDraft().draft?.notes).toBe("Other tab edit");
});
it("restored original suggestions are not mislabeled teacher-edited or freshly eligible", () => {
  localStorage.setItem(DRAFT_KEY, serializeDraft(savedDraft())); render(<App />);
  fireEvent.click(screen.getByRole("button", {name:"Restore Draft"}));
  expect(screen.getByText("AI-Generated Teaching Suggestions")).toBeInTheDocument();
  expect(screen.queryByText("Teacher-Edited Teaching Suggestions")).not.toBeInTheDocument();
  expect(document.querySelector('.badge.pass')).toBeNull();
});

it("restores missing duration and mandatory uncertainty as historical, never a fresh pass", () => {
  const c = offline.cases.provided.response.provisional_options.find(c => c.program_id === "ewm-rubber-band-car")!;
  const d = savedDraft();
  d.program = snapshotProgram({...journey,program_id:c.program_id,museum_facts:c.museum_facts,eligibility:c.eligibility,provisional:true} as unknown as Journey,request);
  localStorage.setItem(DRAFT_KEY,serializeDraft(d));render(<App/>);fireEvent.click(screen.getByRole("button",{name:"Restore Draft"}));
  expect(screen.getByText(/Workshop duration: Not published/)).toBeInTheDocument();
  expect(screen.getByText(/At generation: Needs Confirmation/)).toBeInTheDocument();
  expect(screen.getByText("Unresolved requirements recorded with this draft")).toBeInTheDocument();
  expect(document.querySelector('.badge.pass')).toBeNull();expect(api.journey).not.toHaveBeenCalled();
});
