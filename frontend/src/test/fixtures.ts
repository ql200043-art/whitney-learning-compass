// Sanitized historical API envelopes replayed as MOCK responses, not live UI evidence.
import advisor from "../../../artifacts/agent_runs/case-a-advisor.json";
import plan from "../../../artifacts/agent_runs/case-a-journey.json";
import uncertain from "../../../artifacts/agent_runs/case-c-validated.json";
import none from "../../../artifacts/agent_runs/case-b-advisor.json";
import type { Recommendation, Journey, Teacher } from "../types";
export const normal = advisor.response as unknown as Recommendation;
export const provisional = uncertain.response as unknown as Recommendation;
export const noMatch = none.response as unknown as Recommendation;
export const request = {
  preferences: [],
  required_standards: [],
  mandatory_operational: {},
  ...advisor.request,
} as Teacher;
export const journey = structuredClone(plan.response) as unknown as Journey;
journey.ai_teaching_suggestions.after.follow_up_activity =
  "Compare actual visit observations with clearly labeled predictions. Leave observations blank until the visit.";
