export type Status = "pass" | "fail" | "unknown";
export interface Teacher {
  grades: (number | string)[];
  student_count: number;
  learning_goal: string;
  max_program_fee: number | null;
  budget_currency: string | null;
  assume_usd: boolean;
  max_duration_minutes: number | null;
  preferences: string[];
  required_standards: string[];
  mandatory_operational: Record<string, boolean | string>;
}
export interface Source {
  source_id: string;
  url: string;
  accessed_on?: string;
  verified_on?: string;
  [key: string]: unknown;
}
export interface Facts {
  id: string;
  official_name: string;
  official_url: string;
  grade_levels: string[] | null;
  subjects: string[] | null;
  description: string | null;
  price: {
    listed_text: string | null;
    amount: number | null;
    currency_code: string | null;
    currency_symbol: string | null;
    basis: string | null;
  };
  duration: { listed_text: string | null; minutes: number | null };
  published_standards: unknown[] | null;
  verification: { notes: string[]; [key: string]: unknown };
  sources: Source[];
  field_evidence: Record<
    string,
    { source_id: string; status: string; [key: string]: unknown }
  >;
  unknown_fields: { field: string; reason: string; [key: string]: unknown }[];
}
export interface Match {
  program_id: string;
  official_name: string;
  official_url: string;
  eligibility_status: Status;
  hard_constraints: {
    constraint: string;
    status: Status;
    reason: string;
    assumption?: string | null;
  }[];
  reasons: string[];
  data_quality_warnings: string[];
  program_fee: {
    subtotal: string | null;
    currency: string | null;
    currency_assumption: string | null;
    student_count: number;
    additional_trip_costs: null;
    total_trip_cost: null;
  };
  operational_confirmation: {
    item: string;
    status: string;
    mandatory: boolean;
    requirement: boolean | string | null;
    reason: string;
  }[];
  booking_confirmed: false;
}
export interface Ref {
  program_id: string;
  field: string;
  source_id: string;
}
export interface Candidate {
  program_id: string;
  category: "eligible" | "provisional";
  ai_educational_reasoning: string;
  evidence: Ref[];
  museum_facts: Facts;
  eligibility: Match;
}
export interface Recommendation {
  workflow_id: string;
  workflow_token: string;
  run_id: string;
  interpreted_goal: string;
  recommendations: Candidate[];
  provisional_options: Candidate[];
  eligibility_results: Match[];
  message: string;
  booking_confirmed: false;
  requires_teacher_selection: true;
}
export interface Suggestions {
  program_id: string;
  before: {
    learning_objectives: string[];
    classroom_preparation: string[];
    background_concepts: string[];
    inquiry_questions: string[];
  };
  during: {
    observation_prompts: string[];
    hypothesis_questions: string[];
    critical_thinking: string[];
    evidence_collection: string[];
  };
  after: {
    reflection_questions: string[];
    follow_up_activity: string;
    assessment: string[];
    extension_activity: string | null;
  };
  evidence: Ref[];
}
export interface Journey {
  workflow_id: string;
  run_id: string;
  plan_id: string;
  program_id: string;
  provisional: boolean;
  museum_facts: Facts;
  eligibility: Match;
  ai_teaching_suggestions: Suggestions;
  suggestion_label: string;
  assumptions: string[];
  questions_for_museum: string[];
  safety_notice: string;
  booking_confirmed: false;
}
export interface Activity {
  agent: string;
  status: string;
  output_validation: string;
  tools: { tool: string }[];
  latency_seconds: number;
  usage: {
    input_tokens: number | null;
    cached_input_tokens: number | null;
    output_tokens: number | null;
  };
  model_request_count: number;
}
