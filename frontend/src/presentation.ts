import type { Facts, Match, Teacher, Candidate } from "./types";
export const DISCLAIMER =
  "Independent educational prototype based on publicly available Eli Whitney Museum & Workshop program information. Not affiliated with, endorsed by, or operated by the museum.";
export const labels = {
  pass: "Program Requirements Met",
  unknown: "Needs Confirmation",
  fail: "Does Not Meet Requirements",
};
export const subtotal = (m: Match) =>
  m.program_fee.subtotal === null
    ? "Unverified"
    : `${m.program_fee.currency ?? ""} ${m.program_fee.subtotal}`;
export const duration = (f: Facts) =>
  f.duration.minutes === null
    ? "Not published"
    : `${f.duration.minutes} minutes`;
export const gradeLabel = (grades: (string | number)[]) =>
  grades.map((g) => (g === 0 ? "K" : g === -1 ? "PreK" : String(g))).join(", ");
export const safeUrl = (value: string) => {
  try {
    const u = new URL(value);
    return u.protocol === "https:" &&
      (u.hostname === "www.eliwhitney.org" || u.hostname === "eliwhitney.org")
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
};
export function visibleCandidates(r: {
  recommendations: Candidate[];
  provisional_options: Candidate[];
}) {
  // Defensive presentation gate only. All eligibility calculations remain on the server.
  return [
    ...r.recommendations.filter(
      (c) =>
        c.category === "eligible" &&
        c.eligibility.eligibility_status === "pass",
    ),
    ...r.provisional_options.filter(
      (c) =>
        c.category === "provisional" &&
        c.eligibility.eligibility_status === "unknown",
    ),
  ].slice(0, 3);
}
export function museumQuestions(
  m: Match,
  teacher: Teacher,
  f: Facts,
): string[] {
  const questions: Record<string, string> = {
    capacity: `Can you accommodate our class of ${teacher.student_count} students?`,
    availability:
      typeof teacher.mandatory_operational.availability === "string"
        ? `Is this program available on ${teacher.mandatory_operational.availability}?`
        : "What dates are available for this program?",
    accessibility:
      typeof teacher.mandatory_operational.accessibility === "string"
        ? `Can you support this required accessibility arrangement: ${teacher.mandatory_operational.accessibility}?`
        : "What accessibility accommodations can you arrange?",
    special_delivery:
      typeof teacher.mandatory_operational.special_delivery === "string"
        ? `Can you support this delivery requirement: ${teacher.mandatory_operational.special_delivery}?`
        : "Are there any special delivery or location arrangements to confirm?",
    additional_charges:
      "Are there any additional charges beyond the published per-student program fee?",
    booking_conditions: "What booking conditions and reservation steps apply?",
  };
  const result = m.operational_confirmation.map(
    (item) =>
      questions[item.item] ??
      `What should we confirm about ${item.item.replaceAll("_", " ")}?`,
  );
  if (f.duration.minutes === null)
    result.push("What is the workshop duration?");
  if (f.price.amount === null)
    result.push("What is the current per-student program fee?");
  if (teacher.required_standards.length)
    result.push(
      `Can you provide evidence of alignment to these required standards: ${teacher.required_standards.join(", ")}?`,
    );
  if (f.verification.notes.some((n) => /two sessions/i.test(n)))
    result.push(
      "How do the published duration and per-student fee apply to the recommended two sessions?",
    );
  return result;
}
export function separatedNotes(f: Facts) {
  const safety = f.verification.notes.filter((n) =>
    /safe|safety|ping.?pong|supplied.*ball|projectile/i.test(n),
  );
  return {
    safety,
    verification: f.verification.notes
      .filter(
        (n) =>
          !safety.includes(n) &&
          !/Manual live official-page review|full official detail page reviewed|web-fetch tool returned a cache miss|two sessions|per session|delivery ambiguity/i.test(
            n,
          ),
      )
      .map((n) => {
        if (n.startsWith("A web-extracted view"))
          return "An extracted copy showed grades only through Grade 6, while the reviewed official page lists K, 1, 2, 3, 4, 5, 6 and 7+. Eligibility follows those official grade links.";
        if (n.startsWith("Current Grade Level links"))
          return "Published grade links list Grades 4, 5, 6 and 7+. Linked teaching resources mention other age ranges, which do not expand program eligibility. The linked program information PDFs could not be reviewed; program-specific standards remain unconfirmed.";
        if (n.startsWith("The official page links teaching PDFs"))
          return "The museum links additional teaching documents that could not be reviewed. Program-specific curriculum standards remain unconfirmed.";
        return n;
      }),
    important: f.verification.notes.filter(
      (n) =>
        !safety.includes(n) &&
        /two sessions|per session|delivery ambiguity/i.test(n),
    ),
  };
}
export function inquiryDraft(f: Facts, m: Match, t: Teacher) {
  return `Hello Eli Whitney Museum & Workshop team,\n\nI am exploring ${f.official_name} for a class of ${t.student_count} students in grade(s) ${gradeLabel(t.grades)}. Our learning goal is: ${t.learning_goal}\n\nThe public listing shows ${f.price.listed_text ?? "an unpublished fee"} and ${duration(f)}. Our calculated program-fee subtotal is ${subtotal(m)}${m.program_fee.currency_assumption ? " (USD is an application assumption, not an explicitly published currency code)" : ""}. This excludes other trip costs and is not a binding quote.\n\nCould you help confirm:\n${museumQuestions(
    m,
    t,
    f,
  )
    .map((q) => "- " + q)
    .join(
      "\n",
    )}\n\nProgram source: ${f.official_url}\n\nThank you. This is an inquiry only; no reservation has been made.`;
}
