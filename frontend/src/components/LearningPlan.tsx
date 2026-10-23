import { limitSummary, operationalLabels } from "../evidence";
import { useLayoutEffect, useRef, useState } from "react";
import type { TextareaHTMLAttributes } from "react";
import type { Journey, Suggestions, Teacher } from "../types";
import {
  FactGrid,
  StatusBadge,
  ConfirmationSections,
  SourceDetails,
  SourceContent,
} from "./ProgramDetails";
import { DISCLAIMER, gradeLabel } from "../presentation";
const names: Record<string, string> = {
  learning_objectives: "Learning objectives",
  classroom_preparation: "Classroom preparation",
  background_concepts: "Background concepts",
  inquiry_questions: "Inquiry questions",
  observation_prompts: "Observation prompts",
  hypothesis_questions: "Hypothesis & prediction questions",
  critical_thinking: "Critical-thinking prompts",
  evidence_collection: "Evidence collection",
  reflection_questions: "Reflection & discussion",
  follow_up_activity: "Follow-up classroom activity",
  assessment: "Learning assessment",
  extension_activity: "Optional extension",
};
const phases = [
  {
    key: "before" as const,
    eyebrow: "BEFORE",
    title: "Prepare & Wonder",
    intro: "Build curiosity before the workshop.",
    icon: "01",
  },
  {
    key: "during" as const,
    eyebrow: "DURING",
    title: "Explore & Observe",
    intro: "Follow staff directions. Collect evidence, not invented results.",
    icon: "02",
  },
  {
    key: "after" as const,
    eyebrow: "AFTER",
    title: "Reflect & Extend",
    intro: "Connect actual observations to your learning goals.",
    icon: "03",
  },
];
// Size editable teaching text to its actual rendered content, including mobile widths.
function SuggestionInput(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const element = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const resize = () => {
      if (!element.current) return;
      element.current.style.height = "auto";
      element.current.style.height =
        Math.max(80, element.current.scrollHeight + 2) + "px";
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [props.value]);
  return <textarea {...props} ref={element} />;
}

export default function LearningPlan({
  journey,
  teacher,
  edited,
  onEdit,
  notes,
  onNotes,
  reviewed,
  onReviewed,
  inquiry,
  onInquiry,
  review,
  onReview,
}: {
  journey: Journey;
  teacher: Teacher;
  edited: Suggestions;
  onEdit: (s: Suggestions) => void;
  notes: string;
  onNotes: (s: string) => void;
  reviewed: boolean;
  onReviewed: (v: boolean) => void;
  inquiry: string;
  onInquiry: (s: string) => void;
  review: boolean;
  onReview: (v: boolean) => void;
}) {
  const [copyMessage, setCopyMessage] = useState("");
  const changed =
    JSON.stringify(edited) !== JSON.stringify(journey.ai_teaching_suggestions);
  const setField = (
    phase: "before" | "during" | "after",
    key: string,
    value: string,
    index?: number,
  ) => {
    const next = structuredClone(edited);
    const fields = next[phase] as unknown as Record<
      string,
      string | string[] | null
    >;
    if (index !== undefined) (fields[key] as string[])[index] = value;
    else fields[key] = value;
    onEdit(next);
    onReviewed(false);
  };
  return (
    <div className={"learning-plan " + (review ? "review-mode" : "edit-mode")}>
      <div className="page-heading no-print">
        <div>
          <span className="eyebrow">YOUR CLASSROOM, CONNECTED</span>
          <h1>
            {review
              ? "Review your learning plan"
              : "A journey beyond the workshop"}
          </h1>
          <p>
            {review
              ? "Check the facts, refine the teaching, and take your plan with you."
              : "Editable teaching suggestions, grounded in your selected museum program."}
          </p>
        </div>
        <button className="secondary" onClick={() => onReview(!review)}>
          {review ? "Return to Editing" : "Review & Export"}
        </button>
      </div>
      <header className="print-only print-heading">
        <strong>Whitney Learning Compass</strong>
        <p>From Curriculum Goals to Hands-On Discovery</p>
        <h1>{journey.museum_facts.official_name} · Learning Plan</h1>
      </header>
      {journey.provisional && (
        <div className="note warning">
          <strong>Provisional planning draft.</strong> Mandatory requirements
          remain unresolved. This is not confirmed eligibility or a booking.
        </div>
      )}
      <section className="panel program-overview">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              SELECTED OFFICIAL PROGRAM · READ-ONLY FACTS
            </span>
            <h2>{journey.museum_facts.official_name}</h2>
          </div>
          <StatusBadge status={journey.eligibility.eligibility_status} />
        </div>
        <p>{journey.museum_facts.description}</p>
        <FactGrid facts={journey.museum_facts} match={journey.eligibility} />
        <p>
          <strong>Your class:</strong> Grade(s) {gradeLabel(teacher.grades)} ·{" "}
          {teacher.student_count} students
        </p>
        <p>
          <strong>Learning goal:</strong> {teacher.learning_goal}
        </p>
        <p>
          <strong>Limits:</strong> {limitSummary(teacher)}
        </p>
        {teacher.preferences.length > 0 && (
          <p>
            <strong>Interests:</strong> {teacher.preferences.join(", ")}
          </p>
        )}
        {teacher.required_standards.length > 0 && (
          <p>
            <strong>Required standards:</strong>{" "}
            {teacher.required_standards.join(", ")}
          </p>
        )}
        {Object.keys(teacher.mandatory_operational).length > 0 && (
          <p>
            <strong>Mandatory operational needs:</strong>{" "}
            {Object.entries(teacher.mandatory_operational)
              .map(
                ([k, v]) =>
                  `${operationalLabels[k] ?? "Additional requirement"}: ${v === true ? "verification required" : v}`,
              )
              .join("; ")}
          </p>
        )}
      </section>
      <div className="suggestion-banner">
        <span className="eyebrow">
          {changed
            ? "Teacher-Edited Teaching Suggestions"
            : "AI-Generated Teaching Suggestions"}
        </span>
        {reviewed && (
          <strong className="review-acknowledgment">Reviewed by Teacher</strong>
        )}
        <p>
          {journey.suggestion_label} Edits stay in this browser tab and do not
          trigger model calls. Save a printed copy before closing or refreshing.
        </p>
      </div>
      <div className="journey-timeline">
        {phases.map((phase) => (
          <section className={"phase " + phase.key} key={phase.key}>
            <div className="phase-marker" aria-hidden="true">
              {phase.icon}
            </div>
            <div className="phase-body">
              <header>
                <span className="eyebrow">{phase.eyebrow}</span>
                <h2>{phase.title}</h2>
                <p>{phase.intro}</p>
              </header>
              <div className="phase-fields">
                {Object.entries(edited[phase.key]).map(([key, value]) => (
                  <section className="suggestion-field" key={key}>
                    <h3>{names[key]}</h3>
                    {Array.isArray(value) ? (
                      value.map((text, i) => (
                        <div className="editable-item" key={i}>
                          {!review && (
                            <SuggestionInput
                              aria-label={`${phase.eyebrow} ${names[key]} ${i + 1}`}
                              value={text}
                              rows={Math.max(2, Math.ceil(text.length / 85))}
                              maxLength={2400}
                              onChange={(e) =>
                                setField(phase.key, key, e.target.value, i)
                              }
                            />
                          )}
                          <p className={review ? "" : "print-only"}>
                            {text || "Left blank for educator review."}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="editable-item">
                        {!review && (
                          <SuggestionInput
                            aria-label={`${phase.eyebrow} ${names[key]}`}
                            value={value ?? ""}
                            rows={3}
                            maxLength={2400}
                            onChange={(e) =>
                              setField(phase.key, key, e.target.value)
                            }
                          />
                        )}
                        <p className={review ? "" : "print-only"}>
                          {value || "Optional — no activity added."}
                        </p>
                      </div>
                    )}
                  </section>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
      <section className="panel teacher-notes">
        <h2>Teacher notes & actual observations</h2>
        <p>
          Leave observations blank until the visit occurs. Label predictions as
          predictions; do not treat them as collected evidence.
        </p>
        {!review && (
          <textarea
            aria-label="Teacher notes and actual observations"
            placeholder="Your notes will remain blank until you add them."
            rows={4}
            value={notes}
            maxLength={6000}
            onChange={(e) => {
              onNotes(e.target.value);
              onReviewed(false);
            }}
          />
        )}
        <p className={review ? "preserve-lines" : "print-only preserve-lines"}>
          {notes ||
            "No observations recorded. To be completed by the educator after actual observation."}
        </p>
      </section>
      <ConfirmationSections
        facts={journey.museum_facts}
        match={journey.eligibility}
        teacher={teacher}
        safety={journey.safety_notice}
      />
      <section className="panel sources-panel">
        <SourceDetails facts={journey.museum_facts} refs={edited.evidence} />
        <div className="print-only">
          <h3>Sources & Verification</h3>
          <SourceContent facts={journey.museum_facts} printable />
        </div>
        {journey.assumptions.map((a) => (
          <p key={a}>{a}</p>
        ))}
      </section>
      <section className="panel review-tools no-print">
        <h2>Make it yours, then take it with you</h2>
        <label className="check-label">
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(e) => onReviewed(e.target.checked)}
          />
          <span>
            I have reviewed these teaching suggestions, safety notes and
            unresolved requirements.
          </span>
        </label>
        <button className="primary" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
        <p className="hint">
          Print includes the complete plan and your edits. Browser
          headers/footers can be turned off in the print dialog.
        </p>
      </section>
      <section className="panel inquiry no-print">
        <span className="eyebrow">A CONVERSATION STARTER</span>
        <h2>Museum inquiry draft</h2>
        <p>
          Review and edit this draft before copying. Nothing is sent, submitted
          or booked.
        </p>
        <label className="sr-only" htmlFor="inquiry">
          Museum inquiry draft
        </label>
        <textarea
          id="inquiry"
          rows={12}
          maxLength={12000}
          value={inquiry}
          onChange={(e) => onInquiry(e.target.value)}
        />
        <button
          className="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(inquiry);
              setCopyMessage("Draft copied. Nothing has been sent.");
            } catch {
              setCopyMessage(
                "Copy is unavailable. Select the draft text and copy it manually.",
              );
            }
          }}
        >
          Copy Inquiry Draft
        </button>
        <p role="status">{copyMessage}</p>
      </section>
      <footer className="plan-disclaimer">
        <p>
          {reviewed
            ? "Teacher review acknowledged."
            : "Teacher review pending."}{" "}
          Teaching suggestions are not official museum curriculum. No experiment
          or student outcome is claimed to have occurred.
        </p>
        <p>{DISCLAIMER}</p>
      </footer>
    </div>
  );
}
