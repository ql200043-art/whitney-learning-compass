import identities from "./programIdentities.json";
import type { Journey, Suggestions, Teacher } from "./types";
import { museumQuestions, separatedNotes } from "./presentation";
import { sourceSummary, unknownExplanation, unresolvedChecks } from "./evidence";
export const DRAFT_KEY = "whitney-learning-compass.draft.v1";
export const MAX_DRAFT_SIZE = 300000;
export type TeachingContent = Pick<Suggestions, "before" | "during" | "after">;
export interface ProgramSnapshot {
    id: string;
    name: string;
    url: string;
    description: string | null;
    grades: string[] | null;
    subjects: string[] | null;
    fee: string | null;
    duration_minutes: number | null;
    subtotal: string | null;
    currency: string | null;
    currency_assumption: string | null;
    source_reviewed_at: string | null;
    eligibility_at_generation: "pass" | "unknown" | "fail";
    provisional: boolean;
    mandatory_unknowns: string[];
    museum_questions: string[];
    safety_notes: string[];
    source_notes: string[];
    source_information: string[];
    standards_published: boolean;
}
export interface DraftPayload {
    program: ProgramSnapshot;
    teacher: Teacher;
    original: TeachingContent;
    edited: TeachingContent;
    notes: string;
    inquiry: string;
    reviewed: boolean;
}
export interface LocalDraft extends DraftPayload {
    schema_version: 1;
    draft_id: string;
    created_at: string;
    edited_at: string;
}
export type DraftRead = {
    raw: string | null;
    draft: LocalDraft | null;
    problem: "invalid" | "unavailable" | null;
};
// Project only named fields. Even unexpected nested API properties cannot enter storage.
export function teachingContent(s: TeachingContent): TeachingContent {
    return {
        before: { learning_objectives: [...s.before.learning_objectives], classroom_preparation: [...s.before.classroom_preparation], background_concepts: [...s.before.background_concepts], inquiry_questions: [...s.before.inquiry_questions] },
        during: { observation_prompts: [...s.during.observation_prompts], hypothesis_questions: [...s.during.hypothesis_questions], critical_thinking: [...s.during.critical_thinking], evidence_collection: [...s.during.evidence_collection] },
        after: { reflection_questions: [...s.after.reflection_questions], follow_up_activity: s.after.follow_up_activity, assessment: [...s.after.assessment], extension_activity: s.after.extension_activity },
    };
}
export function teacherSnapshot(t: Teacher): Teacher {
    const operations: Teacher["mandatory_operational"] = {};
    for (const k of ["capacity", "availability", "accessibility", "special_delivery", "additional_charges", "booking_conditions"]) {
        if (Object.hasOwn(t.mandatory_operational, k))
            operations[k] = t.mandatory_operational[k];
    }
    return { grades: [...t.grades], student_count: t.student_count, learning_goal: t.learning_goal, max_program_fee: t.max_program_fee, budget_currency: t.budget_currency, assume_usd: t.assume_usd, max_duration_minutes: t.max_duration_minutes, preferences: [...t.preferences], required_standards: [...t.required_standards], mandatory_operational: operations };
}
export function snapshotProgram(j: Journey, t: Teacher): ProgramSnapshot {
    const f = j.museum_facts, m = j.eligibility, notes = separatedNotes(f);
    return { id: j.program_id, name: f.official_name, url: f.official_url, description: f.description,
        grades: f.grade_levels ? [...f.grade_levels] : null, subjects: f.subjects ? [...f.subjects] : null,
        fee: f.price.listed_text, duration_minutes: f.duration.minutes, subtotal: m.program_fee.subtotal,
        currency: m.program_fee.currency, currency_assumption: m.program_fee.currency_assumption,
        source_reviewed_at: typeof f.verification.verified_on === "string" ? f.verification.verified_on : null,
        eligibility_at_generation: m.eligibility_status, provisional: j.provisional,
        mandatory_unknowns: unresolvedChecks(m), museum_questions: museumQuestions(m, t, f),
        safety_notes: [j.safety_notice, ...notes.safety, ...notes.important],
        source_notes: [...notes.verification, ...f.unknown_fields.map(unknownExplanation), ...j.assumptions],
        source_information: sourceSummary(f), standards_published: f.published_standards !== null,
    };
}
// Small bounded schema validator; no HTML interpretation, dynamic keys or authorization fields.
type Obj = Record<string, unknown>;
function object(v: unknown, keys: string[]): Obj {
    if (!v || typeof v !== "object" || Array.isArray(v))
        throw Error("invalid");
    const o = v as Obj;
    if (Object.keys(o).length !== keys.length || keys.some(k => !Object.hasOwn(o, k)) || Object.keys(o).some(k => !keys.includes(k)))
        throw Error("invalid");
    return o;
}
function text(v: unknown, max = 6000): asserts v is string { if (typeof v !== "string" || v.length > max)
    throw Error("invalid"); }
function bool(v: unknown) { if (typeof v !== "boolean")
    throw Error("invalid"); }
function number(v: unknown, min: number, max: number) { if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)
    throw Error("invalid"); }
function nullable(v: unknown, check: (v: unknown) => void) { if (v !== null)
    check(v); }
function strings(v: unknown, maxItems = 60, maxLength = 6000) { if (!Array.isArray(v) || v.length > maxItems)
    throw Error("invalid"); v.forEach(x => text(x, maxLength)); }
function timestamp(v: unknown) { text(v, 40); if (!/^\d{4}-\d{2}-\d{2}T/.test(v) || !Number.isFinite(Date.parse(v)))
    throw Error("invalid"); }
function content(v: unknown) {
    const s = object(v, ["before", "during", "after"]);
    const b = object(s.before, ["learning_objectives", "classroom_preparation", "background_concepts", "inquiry_questions"]);
    const d = object(s.during, ["observation_prompts", "hypothesis_questions", "critical_thinking", "evidence_collection"]);
    const a = object(s.after, ["reflection_questions", "follow_up_activity", "assessment", "extension_activity"]);
    for (const x of [...Object.values(b), ...Object.values(d), a.reflection_questions, a.assessment]) {
        strings(x, 20, 2400);
        if (!(x as unknown[]).length)
            throw Error("invalid");
    }
    text(a.follow_up_activity, 2400);
    nullable(a.extension_activity, x => text(x, 2400));
}
export function validateDraft(value: unknown): LocalDraft {
    const d = object(value, ["schema_version", "draft_id", "created_at", "edited_at", "program", "teacher", "original", "edited", "notes", "inquiry", "reviewed"]);
    if (d.schema_version !== 1)
        throw Error("invalid");
    text(d.draft_id, 80);
    if (!/^[a-zA-Z0-9-]{10,80}$/.test(d.draft_id))
        throw Error("invalid");
    timestamp(d.created_at);
    timestamp(d.edited_at);
    if (Date.parse(d.edited_at as string) < Date.parse(d.created_at as string))
        throw Error("invalid");
    const p = object(d.program, ["id", "name", "url", "description", "grades", "subjects", "fee", "duration_minutes", "subtotal", "currency", "currency_assumption", "source_reviewed_at", "eligibility_at_generation", "provisional", "mandatory_unknowns", "museum_questions", "safety_notes", "source_notes", "source_information", "standards_published"]);
    text(p.id, 100);
    const identity = (identities as Record<string, {
        name: string;
        url: string;
    }>)[p.id];
    if (!identity || p.name !== identity.name || p.url !== identity.url)
        throw Error("invalid");
    // Pinned identities/URLs only: no javascript:, credentials, query strings or alternate hosts.
    nullable(p.description, text);
    nullable(p.grades, strings);
    nullable(p.subjects, strings);
    nullable(p.fee, text);
    nullable(p.duration_minutes, x => number(x, 1, 10000));
    nullable(p.subtotal, x => { text(x, 30); if (!/^\d+(?:\.\d{1,2})?$/.test(x))
        throw Error("invalid"); });
    nullable(p.currency, x => { text(x, 3); if (!/^[A-Z]{3}$/.test(x))
        throw Error("invalid"); });
    nullable(p.currency_assumption, text);
    nullable(p.source_reviewed_at, x => { text(x, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(x) || !Number.isFinite(Date.parse(x)))
        throw Error("invalid"); });
    if (!["pass", "unknown", "fail"].includes(p.eligibility_at_generation as string))
        throw Error("invalid");
    bool(p.provisional);
    bool(p.standards_published);
    for (const k of ["mandatory_unknowns", "museum_questions", "safety_notes", "source_notes", "source_information"])
        strings(p[k]);
    const t = object(d.teacher, ["grades", "student_count", "learning_goal", "max_program_fee", "budget_currency", "assume_usd", "max_duration_minutes", "preferences", "required_standards", "mandatory_operational"]);
    if (!Array.isArray(t.grades) || !t.grades.length || t.grades.length > 14)
        throw Error("invalid");
    for (const g of t.grades)
        if (!(typeof g === 'number' && Number.isInteger(g) && g >= -1 && g <= 12) && !(typeof g === 'string' && /^(PreK|K|[1-9]|1[0-2]|7\+)$/.test(g)))
            throw Error("invalid");
    number(t.student_count, 1, 10000);
    if (!Number.isInteger(t.student_count))
        throw Error("invalid");
    text(t.learning_goal, 2000);
    nullable(t.max_program_fee, x => number(x, 0, 1e9));
    nullable(t.max_duration_minutes, x => number(x, 1, 10000));
    nullable(t.budget_currency, x => { text(x, 3); if (!/^[A-Z]{3}$/.test(x))
        throw Error("invalid"); });
    bool(t.assume_usd);
    strings(t.preferences, 8, 120);
    strings(t.required_standards, 5, 80);
    if (!t.mandatory_operational || typeof t.mandatory_operational !== 'object' || Array.isArray(t.mandatory_operational))
        throw Error("invalid");
    for (const [k, v] of Object.entries(t.mandatory_operational)) {
        if (!["capacity", "availability", "accessibility", "special_delivery", "additional_charges", "booking_conditions"].includes(k))
            throw Error("invalid");
        if (typeof v !== "boolean")
            text(v, 300);
    }
    content(d.original);
    content(d.edited);
    text(d.notes, 6000);
    text(d.inquiry, 12000);
    bool(d.reviewed);
    return value as LocalDraft;
}
export function readDraft(): DraftRead {
    let raw: string | null;
    try {
        raw = window.localStorage.getItem(DRAFT_KEY);
    }
    catch {
        return { raw: null, draft: null, problem: "unavailable" };
    }
    if (raw === null)
        return { raw, draft: null, problem: null };
    try {
        if (raw.length > MAX_DRAFT_SIZE)
            throw Error("invalid");
        return { raw, draft: validateDraft(JSON.parse(raw)), problem: null };
    }
    catch {
        return { raw, draft: null, problem: "invalid" };
    }
}
export function serializeDraft(draft: LocalDraft): string {
    validateDraft(draft);
    const raw = JSON.stringify(draft);
    if (raw.length > MAX_DRAFT_SIZE)
        throw Error("invalid");
    return raw;
}
