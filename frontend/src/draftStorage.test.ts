import { expect, it, vi } from "vitest";
import { DRAFT_KEY, readDraft, serializeDraft, validateDraft, teachingContent, teacherSnapshot, snapshotProgram } from "./draftStorage";
import { savedDraft } from "./test/draftFixture";
import { journey, request } from "./test/fixtures";
import identities from "./programIdentities.json";
import catalog from "../../data/programs.json";
it("projects a bounded recoverable document and preserves original/edit distinctions", () => {
    const d = savedDraft();
    d.edited.before.learning_objectives[0] = "Teacher edit";
    d.notes = "Actual observation left blank";
    d.reviewed = true;
    localStorage.setItem(DRAFT_KEY, serializeDraft(d));
    expect(readDraft().draft).toEqual(d);
    expect(d.original.before.learning_objectives[0]).not.toBe("Teacher edit");
});
it("pins offline identities to all actual catalog names and URLs", () => {
    expect(identities).toEqual(Object.fromEntries(catalog.programs.map(p => [p.id, { name: p.official_name, url: p.official_url }])));
});
it("explicit projection omits nested secrets, workflow identity, traces and evidence objects", () => {
    const j = structuredClone(journey) as typeof journey & {
        api_key: string;
    };
    j.api_key = "SECRET_KEY";
    Object.assign(j.ai_teaching_suggestions.before, { workflow_token: "SECRET_TOKEN" });
    const t = structuredClone(request);
    Object.assign(t, { run_id: "PRIVATE_RUN" });
    Object.assign(t.mandatory_operational, { authorization: "SECRET_AUTH" });
    const raw = JSON.stringify({ program: snapshotProgram(j, t), teacher: teacherSnapshot(t), content: teachingContent(j.ai_teaching_suggestions) });
    for (const value of ["SECRET_KEY", "SECRET_TOKEN", "SECRET_AUTH", "PRIVATE_RUN", j.workflow_id, j.run_id, j.plan_id, "field_evidence", "workflow_token"])
        expect(raw).not.toContain(value);
});
it("returns no draft for an empty browser", () => expect(readDraft()).toEqual({ raw: null, draft: null, problem: null }));
it.each(["{broken", 'null', '[]', JSON.stringify({ schema_version: 9 }), "x".repeat(300001)])("rejects malformed or oversized storage %s", raw => {
    localStorage.setItem(DRAFT_KEY, raw);
    expect(readDraft().problem).toBe("invalid");
    expect(readDraft().draft).toBeNull();
});
it.each([
    ["schema version", (d: any) => d.schema_version = 2],
    ["missing field", (d: any) => delete d.edited.after],
    ["unknown program", (d: any) => d.program.id = "invented"],
    ["wrong name", (d: any) => d.program.name = "Wrong program"],
    ["script URL", (d: any) => d.program.url = "javascript:alert(1)"],
    ["wrong origin", (d: any) => d.program.url = "https://evil.example/catapult"],
    ["credential URL", (d: any) => d.program.url = "https://secret@www.eliwhitney.org/catapult"],
    ["unknown token field", (d: any) => d.workflow_token = "secret"],
    ["nested trace", (d: any) => d.edited.before.trace = "secret"],
    ["invalid date", (d: any) => d.created_at = "yesterday"],
    ["inverted dates", (d: any) => d.created_at = "2030-01-01T12:00:00Z"],
    ["negative students", (d: any) => d.teacher.student_count = -1],
    ["invalid grade", (d: any) => d.teacher.grades = ["college"]],
    ["negative fee", (d: any) => d.teacher.max_program_fee = -1],
    ["bad subtotal", (d: any) => d.program.subtotal = "free"],
    ["long notes", (d: any) => d.notes = "x".repeat(6001)],
    ["bad status", (d: any) => d.program.eligibility_at_generation = "booked"],
    ["empty phase", (d: any) => d.edited.during.observation_prompts = []],
])("rejects %s", (_name, mutate) => { const d = savedDraft(); mutate(d); expect(() => validateDraft(d)).toThrow(); });
it("handles blocked reads without exception details", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw Error("private detail"); });
    expect(readDraft()).toEqual({ raw: null, draft: null, problem: "unavailable" });
});
