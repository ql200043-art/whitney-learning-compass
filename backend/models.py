"""Typed intake, model-only drafts and authoritative API envelopes."""
from typing import Annotated, Literal, Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, StrictBool, StrictInt, StrictFloat, model_validator
from matching import validate_requirements
from .safety import guard_input

Text = Annotated[str, Field(min_length=1, max_length=600)]
Items = Annotated[list[Text], Field(min_length=1, max_length=4)]
Number = StrictInt | StrictFloat

class Schema(BaseModel):
    model_config = ConfigDict(extra="forbid")

class TeacherRequest(Schema):
    grades: Annotated[list[StrictInt | str], Field(min_length=1,max_length=14)]
    student_count: Annotated[StrictInt, Field(gt=0,le=10000)]
    learning_goal: Annotated[str, Field(min_length=5,max_length=2000)]
    max_program_fee: Number | None = None
    budget_currency: Annotated[str,Field(max_length=3)] | None = None
    assume_usd: StrictBool = False
    max_duration_minutes: Number | None = None
    preferences: Annotated[list[Annotated[str,Field(min_length=1,max_length=120)]],Field(max_length=8)] = Field(default_factory=list)
    required_standards: Annotated[list[Annotated[str,Field(min_length=1,max_length=80)]],Field(max_length=5)] = Field(default_factory=list)
    mandatory_operational: dict[str, StrictBool | Annotated[str,Field(max_length=300)]] = Field(default_factory=dict)

    def matching_input(self):
        return self.model_dump(exclude={"learning_goal"})

    @model_validator(mode="after")
    def check(self):
        validate_requirements(self.matching_input())
        guard_input(self.learning_goal + " " + " ".join(self.preferences) + " " +
                    " ".join(str(v) for v in self.mandatory_operational.values()) + " " + " ".join(self.required_standards))
        return self

class EvidenceRef(Schema):
    program_id: Text
    field: Text
    source_id: Text

class Choice(Schema):
    program_id: Text
    category: Literal["eligible", "provisional"]
    educational_reasoning: Text
    evidence: Annotated[list[EvidenceRef],Field(min_length=1,max_length=3)]

class AdvisorDraft(Schema):
    interpreted_goal: Text
    choices: Annotated[list[Choice],Field(max_length=3)]

class Before(Schema):
    learning_objectives: Annotated[list[Text],Field(min_length=2,max_length=3)]
    classroom_preparation: Items
    background_concepts: Items
    inquiry_questions: Annotated[list[Text],Field(min_length=2,max_length=3)]

class During(Schema):
    observation_prompts: Items
    hypothesis_questions: Items
    critical_thinking: Items
    evidence_collection: Items

class After(Schema):
    reflection_questions: Items
    follow_up_activity: Text
    assessment: Items
    extension_activity: Text | None

class JourneyDraft(Schema):
    program_id: Text
    before: Before
    during: During
    after: After
    evidence: Annotated[list[EvidenceRef],Field(min_length=1,max_length=3)]

class JourneyRequest(Schema):
    workflow_id: UUID
    program_id: Annotated[str,Field(pattern=r"^ewm-[a-z0-9-]+$",max_length=100)]
    teacher_selected: StrictBool
    acknowledge_unknown: StrictBool = False

    @model_validator(mode="after")
    def selected(self):
        if self.teacher_selected is not True:
            raise ValueError("An explicit teacher selection is required")
        return self

class ProgramFacts(Schema):
    id: str
    official_name: str
    official_url: str
    grade_levels: list[str] | None
    subjects: list[str] | None
    description: str | None
    price: dict[str,Any]
    duration: dict[str,Any]
    published_standards: list[dict[str,Any]] | None
    verification: dict[str,Any]
    sources: list[dict[str,Any]]
    field_evidence: dict[str,Any]
    unknown_fields: list[dict[str,Any]]

class Candidate(Schema):
    program_id: str
    category: Literal["eligible","provisional"]
    ai_educational_reasoning: str
    evidence: list[EvidenceRef]
    museum_facts: ProgramFacts
    eligibility: dict[str,Any]

class RecommendationResponse(Schema):
    workflow_id: UUID
    workflow_token: str
    run_id: UUID
    interpreted_goal: str
    recommendations: list[Candidate]
    provisional_options: list[Candidate]
    eligibility_results: list[dict[str,Any]]
    message: str
    requires_teacher_selection: Literal[True] = True
    booking_confirmed: Literal[False] = False

class JourneyResponse(Schema):
    workflow_id: UUID
    run_id: UUID
    plan_id: UUID
    program_id: str
    provisional: bool
    museum_facts: ProgramFacts
    eligibility: dict[str,Any]
    ai_teaching_suggestions: JourneyDraft
    suggestion_label: str
    assumptions: list[str]
    questions_for_museum: list[str]
    safety_notice: str
    booking_confirmed: Literal[False] = False

class ErrorBody(Schema):
    code: str
    message: str
    run_id: str | None = None

class ErrorResponse(Schema):
    error: ErrorBody

