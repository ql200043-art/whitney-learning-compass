import { describe, it, expect } from "vitest";
import { validateIntake } from "./components/Intake";
import {
  museumQuestions,
  separatedNotes,
  inquiryDraft,
  visibleCandidates,
  safeUrl,
} from "./presentation";
import { normal, request, journey } from "./test/fixtures";
import type { Teacher } from "./types";
describe("teacher input validation", () => {
  it.each([[2], [7], ["K"], [3, 4]])(
    "accepts concrete grades %j",
    (...grades) => {
      expect(validateIntake({ ...request, grades })).toEqual([]);
    },
  );
  it.each<Partial<Teacher>>([
    { grades: [] },
    { grades: ["7+"] },
    { student_count: 0 },
    { student_count: 2.5 },
    { max_program_fee: -1 },
    { max_program_fee: 1.234 },
    { assume_usd: false },
    { max_duration_minutes: 0 },
    { max_duration_minutes: 1441 },
    { learning_goal: "a" },
    { learning_goal: "x".repeat(2001) },
  ])("rejects invalid intake %j", (change) => {
    expect(validateIntake({ ...request, ...change }).length).toBeGreaterThan(0);
  });
  it("allows optional limits and interests to be absent", () =>
    expect(
      validateIntake({
        ...request,
        max_program_fee: null,
        max_duration_minutes: null,
        assume_usd: false,
        preferences: [],
      }),
    ).toEqual([]));
});
describe("source-grounded presentation", () => {
  it("separates supplied-ball safety from operational questions", () => {
    const f = journey.museum_facts;
    expect(separatedNotes(f).safety.join(" ")).toMatch(
      /supplied ping-pong ball/,
    );
    expect(
      museumQuestions(journey.eligibility, request, f).join(" "),
    ).not.toMatch(/ping-pong|safety statement/);
  });
  it("makes an inquiry without fabricated availability or contact details", () => {
    const text = inquiryDraft(
      journey.museum_facts,
      journey.eligibility,
      request,
    );
    expect(text).toContain("24 students");
    expect(text).toContain("336.00");
    expect(text).toContain("no reservation");
    expect(text).toContain("What dates are available");
    expect(text).not.toMatch(/@|mailto:/);
  });
  it("excludes a failed candidate from selection, even if mislabeled", () => {
    const response = structuredClone(normal);
    response.recommendations[0].eligibility.eligibility_status = "fail";
    expect(visibleCandidates(response).map((c) => c.program_id)).not.toContain(
      response.recommendations[0].program_id,
    );
  });
  it("never pads fewer than three results", () =>
    expect(
      visibleCandidates({
        ...normal,
        recommendations: normal.recommendations.slice(0, 1),
      }),
    ).toHaveLength(1));
  it.each([
    "javascript:alert(1)",
    "https://evil.example",
    "http://www.eliwhitney.org/catapult",
  ])("blocks unsafe source URL %s", (url) =>
    expect(safeUrl(url)).toBeUndefined(),
  );
  it("allows actual official HTTPS sources", () =>
    expect(safeUrl("https://www.eliwhitney.org/catapult")).toBe(
      "https://www.eliwhitney.org/catapult",
    ));
});
