import type { Facts, Match, Teacher } from "./types";
import { gradeLabel } from "./presentation";

// Presentation only: statuses and calculations always come from the backend.
export function constraintExplanation(c: Match["hard_constraints"][number]) {
  if (c.constraint.startsWith("grade:")) {
    const raw = c.constraint.slice(6);
    const grade = gradeLabel([raw === "0" ? 0 : raw === "-1" ? -1 : raw]);
    return c.status === "pass"
      ? `Grade ${grade} is supported by the museum's published grade information.`
      : c.status === "fail"
        ? `Grade ${grade} is not supported by the museum's published grade information.`
        : `Grade ${grade} eligibility requires source confirmation.`;
  }
  if (c.constraint === "duration" && c.status === "unknown")
    return "Workshop duration is not published or has not been verified. Confirm the length before planning a time-constrained visit.";
  if (c.constraint.startsWith("standard:"))
    return `Required curriculum alignment (${c.constraint.slice(9)}) ${c.status === "pass" ? "is supported by published program evidence" : "requires confirmation"}.`;
  if (c.constraint.startsWith("operational:")) {
    const label =
      operationalLabels[c.constraint.slice(12)] ?? "An operational requirement";
    return `${label}: ${c.status === "unknown" ? "museum confirmation is required" : c.status === "fail" ? "the published condition does not meet your requirement" : "the published condition meets your requirement; booking remains unconfirmed"}.`;
  }
  // Budget and known duration explanations are plain sentences from the matching engine.
  if (["program_fee_budget", "duration"].includes(c.constraint))
    return c.reason;
  return c.status === "pass"
    ? "An additional stated requirement is satisfied."
    : "An additional stated requirement needs review with the museum.";
}
export const operationalLabels: Record<string, string> = {
  capacity: "Class capacity",
  availability: "Requested date",
  accessibility: "Accessibility arrangements",
  special_delivery: "Delivery arrangements",
  additional_charges: "Additional charges",
  booking_conditions: "Booking conditions",
};
export const unresolvedChecks = (m: Match) =>
  m.hard_constraints
    .filter((c) => c.status !== "pass")
    .map(constraintExplanation);
export function limitSummary(t: Teacher) {
  return `${t.max_program_fee === null ? "No maximum program-fee budget specified" : `${t.budget_currency ?? "USD (assumed)"} ${t.max_program_fee} program-fee budget`} · ${t.max_duration_minutes === null ? "No maximum workshop duration specified" : `${t.max_duration_minutes} minutes maximum`}`;
}
const fieldLabels: Record<string, string> = {
  "/description": "Program description",
  "/grade_levels": "Grade eligibility",
  "/subjects": "Subject areas",
  "/price": "Workshop fee",
  "/price/currency_code": "Currency code",
  "/duration": "Workshop duration",
  "/published_standards": "Program-specific curriculum standards",
  "/group_size/min_students": "Minimum class size",
  "/group_size/max_students": "Class capacity",
  "/group_size": "Class size",
  "/accessibility_notes": "Accessibility arrangements",
  "/booking_availability": "Booking availability",
  "/verification/source_updated_on": "Museum page update date",
};
export function fieldLabel(path: string) {
  const key = Object.keys(fieldLabels)
    .sort((a, b) => b.length - a.length)
    .find((k) => path === k || path.startsWith(k + "/"));
  return key ? fieldLabels[key] : "Additional program information";
}
export function sourceSummary(f: Facts) {
  const fields: [string, string, unknown][] = [
    ["/description", "program description (factual summary)", f.description],
    ["/grade_levels", "published grades", f.grade_levels],
    ["/subjects", "subjects", f.subjects],
    ["/price/amount", "workshop fee", f.price.amount],
    ["/duration/minutes", "duration", f.duration.minutes],
  ];
  return fields
    .filter(([path, , value]) => {
      const key = Object.keys(f.field_evidence)
        .sort((a, b) => b.length - a.length)
        .find((k) => path === k || path.startsWith(k + "/"));
      const e = key ? f.field_evidence[key] : undefined;
      return (
        value !== null &&
        value !== undefined &&
        e &&
        ["verified", "normalized", "paraphrased"].includes(e.status) &&
        f.sources.some((s) => s.source_id === e.source_id)
      );
    })
    .map(([, label]) => label);
}
export function unknownExplanation(u: Facts["unknown_fields"][number]) {
  // These records contain machine-readable reason codes; retain the human next step.
  if (u.field === "/verification/source_updated_on")
    return "Museum page update date: Not published. Our source review date is shown above.";
  const next =
    typeof u.next_step === "string"
      ? u.next_step
      : "Please confirm this information with the museum.";
  return `${fieldLabel(u.field)}: ${next}`;
}
