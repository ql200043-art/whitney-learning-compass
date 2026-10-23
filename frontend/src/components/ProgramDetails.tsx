import type { ReactNode } from "react";
import { PublishedGrades } from "./PublishedGrades";
import {
  sourceSummary,
  unknownExplanation,
  unresolvedChecks,
} from "../evidence";
import type { Candidate, Facts, Match, Teacher } from "../types";
import {
  labels,
  subtotal,
  duration,
  safeUrl,
  museumQuestions,
  separatedNotes,
} from "../presentation";
export function StatusBadge({
  status,
}: {
  status: Match["eligibility_status"];
}) {
  return <span className={"badge " + status}>{labels[status]}</span>;
}
export function FactGrid({
  facts,
  match,
  compact = false,
}: {
  facts: Facts;
  match: Match;
  compact?: boolean;
}) {
  return (
    <>
      <dl className="facts-grid">
        <div className="published-grades-fact">
          <dt>Published grades</dt>
          <dd><PublishedGrades labels={facts.grade_levels} /></dd>
        </div>
        {!compact && (
          <div>
            <dt>Subjects</dt>
            <dd>{facts.subjects?.join(" · ") ?? "Unknown"}</dd>
          </div>
        )}
        <div>
          <dt>Published fee</dt>
          <dd>{facts.price.listed_text ?? "Not published"}</dd>
        </div>
        <div>
          <dt>Class program fee</dt>
          <dd>{subtotal(match)}</dd>
        </div>
        <div>
          <dt>Workshop duration</dt>
          <dd>{duration(facts)}</dd>
        </div>
        <div>
          <dt>Booking</dt>
          <dd>Not confirmed</dd>
        </div>
      </dl>
      {compact && (
        <details className="subject-details">
          <summary>Subject areas</summary>
          <p>{facts.subjects?.join(" · ") ?? "Not published"}</p>
        </details>
      )}
      {facts.duration.minutes === null && (
        <p className="note warning">
          Workshop duration is not published. Please confirm the length with the
          museum. Meeting applicable requirements does not mean every program
          detail is known.
        </p>
      )}
      {match.program_fee.currency_assumption && (
        <p className="currency-note">{match.program_fee.currency_assumption}</p>
      )}
      <p className="hint">
        Program fees exclude transportation, meals and unverified additional
        charges.
      </p>
    </>
  );
}
export function SourceContent({
  facts,
  printable = false,
}: {
  facts: Facts;
  printable?: boolean;
}) {
  const { verification } = separatedNotes(facts);
  const supported = sourceSummary(facts);
  return (
    <div className="source-content">
      <p>
        <a href={safeUrl(facts.official_url)} target="_blank" rel="noreferrer">
          Official museum program page ↗
        </a>
        <br />
        <a className="source-url" href={safeUrl(facts.official_url)}>
          {facts.official_url}
        </a>
      </p>
      {facts.sources
        .filter((source) => source.url !== facts.official_url)
        .map((source) => (
          <p key={source.source_id}>
            <a href={safeUrl(source.url)} target="_blank" rel="noreferrer">
              Additional official museum source ↗
            </a>
          </p>
        ))}
      <p>
        Source review:{" "}
        {String(facts.verification.verified_on ?? "See source records")}.
        Published information may change; confirm before booking.
      </p>
      <p>
        {supported.length
          ? `Verified source information: ${supported.join(", ")}.`
          : "Published details require source confirmation."}
      </p>
      {facts.duration.minutes === null && (
        <p>
          <strong>Workshop duration:</strong> Not published. Please confirm the
          length before planning a time-constrained visit.
        </p>
      )}
      <p>
        Program-specific curriculum standards:{" "}
        {facts.published_standards === null
          ? "Not published; any suggested alignment requires educator review."
          : "See the published source evidence."}
      </p>
      {verification.map((n, i) => (
        <p key={i}>{n}</p>
      ))}
      <details
        className="unresolved-source-fields"
        open={printable || undefined}
      >
        <summary>Information still to confirm</summary>
        <ul>
          {facts.unknown_fields
            .filter(
              (u) =>
                u.field !== "/published_standards" &&
                !u.field.startsWith("/duration/") &&
                (!printable ||
                  ![
                    "/group_size",
                    "/accessibility_notes",
                    "/booking_availability",
                  ].some(
                    (path) =>
                      u.field === path || u.field.startsWith(path + "/"),
                  )),
            )
            .map((u, i) => (
              <li key={i}>{unknownExplanation(u)}</li>
            ))}
        </ul>
      </details>
    </div>
  );
}
export function SourceDetails({
  facts,
  label = "Sources & Verification",
}: {
  facts: Facts;
  label?: string;
  refs?: { field: string; source_id: string }[];
}) {
  return (
    <details className="source-details">
      <summary>{label}</summary>
      <SourceContent facts={facts} />
    </details>
  );
}
export function ConfirmationSections({
  facts,
  match,
  teacher,
  safety,
}: {
  facts: Facts;
  match: Match;
  teacher: Teacher;
  safety?: string;
}) {
  const notes = separatedNotes(facts);
  return (
    <div className="confirmation-grid">
      <section className="panel">
        <h3>Questions to Confirm with the Museum</h3>
        <p className="hint">Eligibility does not establish bookability.</p>
        <ul>
          {museumQuestions(match, teacher, facts).map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
        {unresolvedChecks(match).length > 0 && (
          <div className="note warning">
            <strong>Unresolved mandatory checks</strong>
            <ul>
              {unresolvedChecks(match).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <section className="panel">
        <h3>Safety & Important Notes</h3>
        <p>
          {safety ??
            "Follow museum staff procedures. Do not independently operate equipment or substitute projectiles. Classroom activities remain editable suggestions for educator review."}
        </p>
        {notes.safety.map((n) => (
          <p key={n}>{n}</p>
        ))}
        {notes.important.map((n) => (
          <p key={n}>{n}</p>
        ))}
        <p>
          Record actual observations. Clearly label predictions, and leave
          observation notes blank until evidence has been collected.
        </p>
      </section>
    </div>
  );
}
export function ProgramCard({
  candidate,
  index,
  selectedForCompare,
  onCompare,
  onSelect,
}: {
  candidate: Candidate;
  index: number;
  selectedForCompare: boolean;
  onCompare: () => void;
  onSelect: () => void;
}) {
  const f = candidate.museum_facts,
    m = candidate.eligibility;
  return (
    <article className="program-card">
      <div className="card-top">
        <span className="eyebrow">
          WORKSHOP {String(index + 1).padStart(2, "0")}
        </span>
        <StatusBadge status={m.eligibility_status} />
      </div>
      <h3>{f.official_name}</h3>
      <p className="program-description">{f.description}</p>
      <FactGrid facts={f} match={m} compact />
      <div className="educational-fit">
        <span className="eyebrow">WHY THIS COULD FIT · AI INTERPRETATION</span>
        <p>{candidate.ai_educational_reasoning}</p>
      </div>
      {unresolvedChecks(m).length > 0 && (
        <div className="note warning">
          <ul>
            {unresolvedChecks(m).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="hint">Booking arrangements require museum confirmation.</p>
      {separatedNotes(f).important.map((n) => (
        <p className="note warning" key={n}>
          {n}
        </p>
      ))}
      {separatedNotes(f).safety.length > 0 && (
        <details>
          <summary>Workshop safety notes</summary>
          {separatedNotes(f).safety.map((n) => (
            <p key={n}>{n}</p>
          ))}
        </details>
      )}
      <a
        className="program-source-link"
        href={safeUrl(f.official_url)}
        target="_blank"
        rel="noreferrer"
      >
        Official museum program page ↗
      </a>
      <SourceDetails
        facts={f}
        refs={candidate.evidence}
        label="Additional Source Details"
      />
      <div className="card-actions">
        <label className="check-label">
          <input
            type="checkbox"
            checked={selectedForCompare}
            onChange={onCompare}
          />
          <span>Compare {f.official_name}</span>
        </label>
        <button className="primary action-accent" onClick={onSelect}>
          Select This Program
        </button>
      </div>
    </article>
  );
}
export function Comparison({
  candidates,
  onSelect,
}: {
  candidates: Candidate[];
  onSelect: (c: Candidate) => void;
}) {
  const rows: [string, (c: Candidate) => ReactNode][] = [
    ["Educational alignment", (c) => c.ai_educational_reasoning],
    [
      "Published grades",
      (c) => <PublishedGrades labels={c.museum_facts.grade_levels} />,
    ],
    ["Subjects", (c) => c.museum_facts.subjects?.join(", ") ?? "Unknown"],
    [
      "Fee per student",
      (c) => c.museum_facts.price.listed_text ?? "Not published",
    ],
    ["Class program fee", (c) => subtotal(c.eligibility)],
    ["Duration", (c) => duration(c.museum_facts)],
    ["Eligibility", (c) => labels[c.eligibility.eligibility_status]],
    [
      "Mandatory unknowns",
      (c) =>
        unresolvedChecks(c.eligibility).join(" ") ||
        "None among the stated requirements",
    ],
    [
      "Currency assumption",
      (c) =>
        c.eligibility.program_fee.currency_assumption ??
        "No assumption applied",
    ],
    [
      "Operational confirmation",
      () =>
        "Capacity, availability, accessibility, delivery, additional charges and booking conditions remain unconfirmed.",
    ],
  ];
  return (
    <section className="panel comparison" aria-label="Program comparison">
      <div className="section-heading">
        <div>
          <span className="eyebrow">A CLEARER CHOICE</span>
          <h2>Compare your possibilities</h2>
        </div>
      </div>
      <div
        className="mobile-comparison"
        role="region"
        aria-label="Program comparison by attribute"
      >
        <p>
          Compare one consideration at a time. All values come from the same
          program results shown above.
        </p>
        {rows.map(([label, get]) => (
          <section key={label}>
            <h3>{label}</h3>
            <dl>
              {candidates.map((c) => (
                <div key={c.program_id}>
                  <dt>{c.museum_facts.official_name}</dt>
                  <dd>{get(c)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <div className="mobile-compare-actions">
          {candidates.map((c) => (
            <button
              key={c.program_id}
              className="primary action-accent"
              onClick={() => onSelect(c)}
            >
              Select {c.museum_facts.official_name}
            </button>
          ))}
        </div>
      </div>
      <div
        className="table-scroll"
        tabIndex={0}
        aria-label="Scrollable program comparison"
      >
        <table>
          <caption className="sr-only">
            Side-by-side comparison of selected programs
          </caption>
          <thead>
            <tr>
              <th scope="col">Your considerations</th>
              {candidates.map((c) => (
                <th scope="col" key={c.program_id}>
                  {c.museum_facts.official_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, get]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                {candidates.map((c) => (
                  <td key={c.program_id}>{get(c)}</td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row">Your choice</th>
              {candidates.map((c) => (
                <td key={c.program_id}>
                  <button className="primary action-accent" onClick={() => onSelect(c)}>
                    Select {c.museum_facts.official_name}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
