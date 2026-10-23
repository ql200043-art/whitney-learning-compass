import type { LocalDraft } from "../draftStorage";
import { PublishedGrades } from "./PublishedGrades";
import { labels } from "../presentation";
export const draftDate = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
export const DRAFT_PRIVACY = "Drafts are saved only in this browser on this device. They are not uploaded or shared with the museum. Do not include student names, private records or secrets.";
export function HistoricalNotice({ savedAt }: {
    savedAt: string;
}) {
    return <section className="note warning historical-notice"><strong>Saved Draft — Not Revalidated</strong><p>This plan was saved on {draftDate(savedAt)}. Published program details and eligibility have not been rechecked. Confirm current information with the museum before booking. This local document cannot authorize a new AI workflow.</p></section>;
}
export function HistoricalProgram({ draft }: {
    draft: LocalDraft;
}) {
    const p = draft.program;
    return <section className="panel program-overview">
    <span className="eyebrow">HISTORICAL PROGRAM SNAPSHOT · READ-ONLY</span><h2>{p.name}</h2>
    <p>At generation: {labels[p.eligibility_at_generation]} (historical; not revalidated).</p>
    <p>{p.description}</p>
    <dl className="facts-grid">
      <div><dt>Saved published grades</dt><dd><PublishedGrades labels={p.grades}/></dd></div>
      <div><dt>Saved subjects</dt><dd>{p.subjects?.join(" · ") ?? "Not published"}</dd></div>
      <div><dt>Saved published fee</dt><dd>{p.fee ?? "Not published"}</dd></div>
      <div><dt>Saved class program fee</dt><dd>{p.subtotal === null ? "Unverified" : `${p.currency ?? ""} ${p.subtotal}`}</dd></div>
      <div><dt>Saved workshop duration</dt><dd>{p.duration_minutes === null ? "Not published" : `${p.duration_minutes} minutes`}</dd></div>
      <div><dt>Booking</dt><dd>Not confirmed</dd></div>
    </dl>
    {p.currency_assumption && <p className="currency-note">{p.currency_assumption}</p>}
    <p className="hint">Historical program-fee subtotal only; transportation, meals and unverified additional charges are excluded. This is not a current quote.</p>
    {p.duration_minutes === null && <p className="note warning">Workshop duration: Not published. Confirm the duration before planning a time-constrained visit.</p>}
    {(p.provisional || p.mandatory_unknowns.length > 0) && <div className="note warning"><strong>Unresolved requirements recorded with this draft</strong><ul>{p.mandatory_unknowns.map((n, i) => <li key={i}>{n}</li>)}</ul><p>Eligibility and booking remain unconfirmed.</p></div>}
  </section>;
}
export function HistoricalSources({ draft }: {
    draft: LocalDraft;
}) {
    const p = draft.program;
    return <>
    <div className="confirmation-grid">
      <section className="panel"><h3>Questions to Confirm with the Museum</h3><p>Saved questions; no answers or availability have been confirmed.</p><ul>{p.museum_questions.map((q, i) => <li key={i}>{q}</li>)}</ul></section>
      <section className="panel"><h3>Safety & Important Notes</h3>{p.safety_notes.map((n, i) => <p key={i}>{n}</p>)}<p>Use actual observations. Keep predictions separate from collected evidence.</p></section>
    </div>
    <section className="panel sources-panel historical-sources"><h3>Sources & Verification</h3><a href={p.url} target="_blank" rel="noreferrer">Official museum program page ↗</a><p className="source-url"><a href={p.url}>{p.url}</a></p><p>Original source review: {p.source_reviewed_at ?? "Not recorded"}. This saved snapshot has not been revalidated.</p><p>Source information recorded at generation: {p.source_information.join(", ") || "Not recorded"}.</p><p>Program-specific standards: {p.standards_published ? "Refer to the original museum source; current alignment is unconfirmed." : "Not published in the saved record."}</p><details className="saved-source-notes" open><summary>Saved limitations and assumptions</summary><ul>{p.source_notes.map((n, i) => <li key={i}>{n}</li>)}</ul></details></section>
  </>;
}
