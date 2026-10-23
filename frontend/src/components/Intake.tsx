import { teachingExamples, applyExample } from "../examples";
import { useState } from "react";
import type { Teacher } from "../types";
export const EXAMPLE =
  "I want my fourth-grade students to explore force, motion, and engineering design through hands-on experiments.";
export const initialTeacher: Teacher = {
  grades: [4],
  student_count: 24,
  learning_goal: "",
  max_program_fee: null,
  budget_currency: null,
  assume_usd: false,
  max_duration_minutes: null,
  preferences: [],
  required_standards: [],
  mandatory_operational: {},
};
export function validateIntake(t: Teacher): string[] {
  const errors: string[] = [];
  if (
    !t.grades.length ||
    t.grades.some(
      (g) =>
        !["K", ...Array.from({ length: 12 }, (_, i) => i + 1)].includes(
          g as number,
        ),
    )
  )
    errors.push("Select at least one supported grade.");
  if (
    !Number.isInteger(t.student_count) ||
    t.student_count < 1 ||
    t.student_count > 10000
  )
    errors.push("Student count must be a whole number from 1 to 10,000.");
  if (t.learning_goal.trim().length < 5 || t.learning_goal.length > 2000)
    errors.push("Describe a learning goal in 5–2,000 characters.");
  if (
    t.max_program_fee !== null &&
    (!Number.isFinite(t.max_program_fee) ||
      t.max_program_fee < 0 ||
      Math.abs(t.max_program_fee * 100 - Math.round(t.max_program_fee * 100)) >
        1e-7)
  )
    errors.push("Enter a nonnegative budget with at most two decimal places.");
  if (t.max_program_fee !== null && !t.assume_usd)
    errors.push("Acknowledge the USD application assumption for this budget.");
  if (
    t.max_duration_minutes !== null &&
    (!Number.isFinite(t.max_duration_minutes) ||
      t.max_duration_minutes <= 0 ||
      t.max_duration_minutes > 1440)
  )
    errors.push(
      "Workshop duration must be greater than zero and at most 1,440 minutes.",
    );
  if (t.preferences.length > 8 || t.preferences.some((x) => x.length > 120))
    errors.push("Use up to eight interests, each no more than 120 characters.");
  if (
    t.required_standards.length > 5 ||
    t.required_standards.some((x) => x.length > 80)
  )
    errors.push("Use up to five standards, each no more than 80 characters.");
  return errors;
}
export default function Intake({
  value,
  onChange,
  onSubmit,
  busy,
}: {
  value: Teacher;
  onChange: (v: Teacher) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const [errors, setErrors] = useState<string[]>([]);
  const [exampleNotice, setExampleNotice] = useState("");
  const update = (patch: Partial<Teacher>) => {
    setErrors([]);
    onChange({ ...value, ...patch });
  };
  const operational = (key: string, v: string | boolean) => {
    const next = { ...value.mandatory_operational };
    if (!v) delete next[key];
    else next[key] = v;
    update({ mandatory_operational: next });
  };
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const found = validateIntake(value);
        setErrors(found);
        if (!found.length && !busy) onSubmit();
      }}
      aria-label="Teacher requirements"
    >
      <fieldset disabled={busy} className="form-body">
        <legend className="sr-only">Class and learning needs</legend>
        <section
          className="quick-start form-section"
          aria-labelledby="example-heading"
        >
          <span className="eyebrow">A LITTLE INSPIRATION</span>
          <h2 id="example-heading">Start with an example</h2>
          <p>
            Load a starting point, then make it your own. Nothing is submitted
            until you choose Discover Programs.
          </p>
          <div className="example-options">
            {teachingExamples.map((example, index) => (
              <button
                key={example.title}
                type="button"
                className={`example-option example-${index + 1}`}
                aria-label={`Load ${example.title} example`}
                onClick={() => {
                  onChange(applyExample(value, example));
                  setErrors([]);
                  setExampleNotice(
                    `${example.title} loaded. Grade, students, goal, topics, budget and time are filled in and editable. Any advanced requirements are kept. Please acknowledge the USD assumption before discovering programs.`,
                  );
                }}
              >
                <strong>{example.title}</strong>
                <span>
                  Grade {example.grade} · {example.students} students
                </span>
                <small>${example.budget} fee budget · 90 minutes</small>
              </button>
            ))}
          </div>
          {exampleNotice && (
            <div className="example-feedback">
              <p role="status">{exampleNotice}</p>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  onChange({
                    ...structuredClone(initialTeacher),
                    required_standards: value.required_standards,
                    mandatory_operational: value.mandatory_operational,
                  });
                  setErrors([]);
                  setExampleNotice(
                    "Example cleared. Review the standard class defaults; optional limits are blank. Advanced requirements are kept.",
                  );
                }}
              >
                Clear example
              </button>
            </div>
          )}
        </section>
        <section className="form-section">
          <div className="section-heading">
            <span className="number">01</span>
            <div>
              <h2>Start with your class</h2>
              <p>
                Class-level information only. Please omit student names and
                personal records.
              </p>
            </div>
          </div>
          <fieldset className="grades">
            <legend>
              Grade levels{" "}
              <span className="required">Required · select all that apply</span>
            </legend>
            <div className="grade-options">
              {["K", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                <label
                  key={g}
                  className={
                    value.grades.includes(g) ? "grade active" : "grade"
                  }
                >
                  <input
                    type="checkbox"
                    checked={value.grades.includes(g)}
                    onChange={() =>
                      update({
                        grades: value.grades.includes(g)
                          ? value.grades.filter((v) => v !== g)
                          : [...value.grades, g],
                      })
                    }
                  />
                  <span>{g}</span>
                </label>
              ))}
            </div>
            <p className="hint">
              Designed primarily for Grades 2–7. Every grade in a mixed-grade
              class must qualify.
            </p>
          </fieldset>
          <label className="short-field">
            Number of students <span className="required">Required</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="10000"
              step="1"
              value={
                Number.isNaN(value.student_count) ? "" : value.student_count
              }
              onChange={(e) =>
                update({
                  student_count:
                    e.target.value === "" ? NaN : Number(e.target.value),
                })
              }
            />
          </label>
        </section>
        <section className="form-section">
          <div className="section-heading">
            <span className="number">02</span>
            <div>
              <h2>What will your students discover?</h2>
              <p>
                A thoughtful goal helps connect the workshop to your teaching.
              </p>
            </div>
          </div>
          <label>
            Learning goal <span className="required">Required</span>
            <textarea
              rows={4}
              maxLength={2000}
              value={value.learning_goal}
              placeholder={EXAMPLE}
              onChange={(e) => update({ learning_goal: e.target.value })}
            />
          </label>
          <div className="field-footer">
            <button
              type="button"
              className="text-button"
              onClick={() => update({ learning_goal: EXAMPLE })}
            >
              Use force & motion example
            </button>
            <small>{value.learning_goal.length}/2,000</small>
          </div>
          <label>
            Subject or topic interests{" "}
            <span className="optional">Optional · comma-separated</span>
            <input
              placeholder="Engineering design, forces, observation"
              maxLength={968}
              value={value.preferences.join(",")}
              onChange={(e) =>
                update({ preferences: e.target.value.split(",") })
              }
              onBlur={() =>
                update({
                  preferences: value.preferences
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
        </section>
        <section className="form-section">
          <div className="section-heading">
            <span className="number">03</span>
            <div>
              <h2>Set your planning boundaries</h2>
              <p>Leave a limit blank if it is flexible.</p>
            </div>
          </div>
          <div className="two-columns">
            <label>
              Maximum program-fee budget{" "}
              <span className="optional">Optional · USD assumption</span>
              <div className="input-prefix">
                <span>$</span>
                <input
                  aria-label="Maximum program-fee budget"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 400"
                  aria-describedby="budget-help"
                  value={value.max_program_fee ?? ""}
                  onChange={(e) =>
                    update({
                      max_program_fee:
                        e.target.value === "" ? null : Number(e.target.value),
                      budget_currency: e.target.value === "" ? null : "USD",
                    })
                  }
                />
              </div>
              <small id="budget-help" className="input-help">
                Leave blank if you have no maximum budget.
              </small>
            </label>
            <label>
              Maximum workshop duration{" "}
              <span className="optional">Optional · minutes</span>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max="1440"
                placeholder="e.g., 90"
                aria-label="Maximum workshop duration"
                aria-describedby="duration-help"
                value={value.max_duration_minutes ?? ""}
                onChange={(e) =>
                  update({
                    max_duration_minutes:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <small id="duration-help" className="input-help">
                Leave blank if your workshop time is flexible.
              </small>
            </label>
          </div>
          <div className="note">
            <strong>Workshop fees, not the whole trip.</strong> Transportation,
            meals and unverified additional charges are excluded.
          </div>
          <label className="check-label">
            <input
              type="checkbox"
              checked={value.assume_usd}
              onChange={(e) => update({ assume_usd: e.target.checked })}
            />
            <span>
              I accept the USD assumption for published $ fees.
              <small>
                USD is assumed for this Connecticut prototype; the museum does
                not explicitly publish a currency code. This also enables a
                class subtotal when no budget is specified.
              </small>
            </span>
          </label>
          <details className="advanced">
            <summary>
              Specific standards & mandatory operational needs{" "}
              <span>Optional</span>
            </summary>
            <p>
              Only add requirements that must be verified. Unpublished
              requirements make a program provisional; they do not become
              verified through AI.
            </p>
            <label>
              Required curriculum standards{" "}
              <span className="optional">Exact codes, comma-separated</span>
              <input
                value={value.required_standards.join(",")}
                placeholder="Add only if verified alignment is mandatory"
                maxLength={405}
                onChange={(e) =>
                  update({ required_standards: e.target.value.split(",") })
                }
                onBlur={() =>
                  update({
                    required_standards: value.required_standards
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={Boolean(value.mandatory_operational.capacity)}
                onChange={(e) => operational("capacity", e.target.checked)}
              />
              <span>Verified capacity for this class size is mandatory</span>
            </label>
            <label>
              Required visit date
              <input
                type="date"
                value={String(value.mandatory_operational.availability ?? "")}
                onChange={(e) => operational("availability", e.target.value)}
              />
            </label>
            <label>
              Mandatory accessibility arrangement
              <input
                maxLength={300}
                value={String(value.mandatory_operational.accessibility ?? "")}
                placeholder="Describe an arrangement, not a student's diagnosis"
                onChange={(e) => operational("accessibility", e.target.value)}
              />
            </label>
            <label>
              Mandatory delivery arrangement
              <input
                maxLength={300}
                value={String(
                  value.mandatory_operational.special_delivery ?? "",
                )}
                onChange={(e) =>
                  operational("special_delivery", e.target.value)
                }
              />
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={Boolean(
                  value.mandatory_operational.additional_charges,
                )}
                onChange={(e) =>
                  operational("additional_charges", e.target.checked)
                }
              />
              <span>Verification of additional charges is mandatory</span>
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={Boolean(
                  value.mandatory_operational.booking_conditions,
                )}
                onChange={(e) =>
                  operational("booking_conditions", e.target.checked)
                }
              />
              <span>Verification of booking conditions is mandatory</span>
            </label>
          </details>
        </section>
        {errors.length > 0 && (
          <div role="alert" className="error">
            <strong>Check these details before searching</strong>
            <ul>
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="form-action">
          <p>
            One deliberate search starts the Program Advisor.
            <br />
            Your requirements stay in control.
          </p>
          <button className="primary action-accent" type="submit">
            {busy ? "Finding thoughtful matches…" : "Discover Programs"}{" "}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </fieldset>
    </form>
  );
}
