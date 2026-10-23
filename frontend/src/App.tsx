import CatalogChecks from "./components/CatalogChecks";
import { limitSummary } from "./evidence";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Activity,
  Candidate,
  Journey,
  Recommendation,
  Teacher,
} from "./types";
import { api, errorMessage } from "./api";
import {
  DISCLAIMER,
  gradeLabel,
  inquiryDraft,
  visibleCandidates,
} from "./presentation";
import Intake, { initialTeacher } from "./components/Intake";
import {
  Comparison,
  ConfirmationSections,
  FactGrid,
  ProgramCard,
  SourceDetails,
  StatusBadge,
} from "./components/ProgramDetails";
import LearningPlan from "./components/LearningPlan";
import { useLocalDraft } from "./useLocalDraft";
import { snapshotProgram, teacherSnapshot, teachingContent } from "./draftStorage";
import type { DraftPayload, LocalDraft, ProgramSnapshot, TeachingContent } from "./draftStorage";
import { DRAFT_PRIVACY, draftDate } from "./components/DraftDetails";
const stepLabels = [
  "Teaching Goal",
  "Discover & Compare",
  "Your Selection",
  "Learning Journey",
  "Review & Export",
];
type Screen = "intake" | "discovery" | "selection" | "journey" | "review";
function Compass() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="17" stroke="currentColor" />
      <path d="M26 12 22 23 12 28 17 17Z" fill="currentColor" />
      <path d="m20 2 0 5m0 26v5M2 20h5m26 0h5" stroke="currentColor" />
    </svg>
  );
}
export default function App() {
  const [mobileSteps, setMobileSteps] = useState(false);
  const [teacher, setTeacher] = useState<Teacher>(initialTeacher),
    [submitted, setSubmitted] = useState<Teacher | null>(null),
    [screen, setScreen] = useState<Screen>("intake");
  const [recommendation, setRecommendation] = useState<Omit<
      Recommendation,
      "workflow_token"
    > | null>(null),
    token = useRef<string | null>(null),
    inFlight = useRef(false);
  const [selected, setSelected] = useState<Candidate | null>(null),
    [compare, setCompare] = useState<string[]>([]),
    [showCompare, setShowCompare] = useState(false),
    [ack, setAck] = useState(false);
  const [journey, setJourney] = useState<Journey | null>(null),
    [edited, setEdited] = useState<TeachingContent | null>(null),
    [notes, setNotes] = useState(""),
    [inquiry, setInquiry] = useState(""),
    [reviewed, setReviewed] = useState(false);
  const [busy, setBusy] = useState<"advisor" | "designer" | null>(null),
    [error, setError] = useState(""),
    [activity, setActivity] = useState<Activity | null>(null),
    [activityError, setActivityError] = useState("");
  const [health, setHealth] = useState<"checking" | "online" | "offline">(
      "checking",
    ),
    [catalogCount, setCatalogCount] = useState<number | null>(null);
  const [restored, setRestored] = useState<LocalDraft | null>(null);
  const [snapshot, setSnapshot] = useState<ProgramSnapshot | null>(null);
  const [recoveryDismissed, setRecoveryDismissed] = useState(false);
  const payload = useMemo<DraftPayload | null>(() => {
    const program = restored?.program ?? snapshot;
    if (!program || !submitted || !edited || (!journey && !restored)) return null;
    return {program, teacher: teacherSnapshot(submitted), original: teachingContent(restored?.original ?? journey!.ai_teaching_suggestions), edited: teachingContent(edited), notes, inquiry, reviewed};
  }, [restored, snapshot, submitted, edited, journey, notes, inquiry, reviewed]);
  const drafts = useLocalDraft(payload);
  function restoreDraft() {
    if (inFlight.current) return;
    const value = drafts.refresh();
    if (!value.draft) return;
    if ((journey || restored || recommendation) && !window.confirm("Replace the plan open in this tab with the saved local copy? Unsaved edits in this tab will be lost.")) return;
    token.current = null; setRecommendation(null); setSelected(null); setJourney(null); setSnapshot(null);
    setActivity(null); setActivityError(""); setError(""); setCompare([]); setShowCompare(false); setAck(false);
    setRestored(value.draft); setSubmitted(value.draft.teacher); setEdited(teachingContent(value.draft.edited));
    setNotes(value.draft.notes); setInquiry(value.draft.inquiry); setReviewed(value.draft.reviewed);
    drafts.adopt(value); setScreen("journey");
  }
  function deleteDraft() {
    const value = drafts.refresh();
    if (window.confirm("Delete the saved local copy from this browser? The plan currently open in this tab will remain. Automatic saving will pause until you explicitly save again.")) drafts.remove(value.raw);
  }
  function saveThisPlan() {
    const value = drafts.refresh();
    if (value.raw !== null && !window.confirm("Replace the saved local draft with this plan? Only one draft is kept in this browser. The previous saved copy will be permanently replaced.")) return;
    drafts.authorize(value.raw);
  }
  const headingRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    api
      .health()
      .then(() => {
        if (active) setHealth("online");
      })
      .catch(() => {
        if (active) setHealth("offline");
      });
    api
      .catalog()
      .then((c) => {
        if (active) setCatalogCount(c.programs.length);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    headingRef.current?.focus();
    setMobileSteps(false);
  }, [screen]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (recommendation || journey) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [recommendation, journey]);
  function restart() {
    if (inFlight.current) return;
    drafts.release();
    setRestored(null); setSnapshot(null); setRecoveryDismissed(true);
    token.current = null;
    setRecommendation(null);
    setSelected(null);
    setJourney(null);
    setEdited(null);
    setNotes("");
    setInquiry("");
    setReviewed(false);
    setActivity(null);
    setActivityError("");
    setError("");
    setAck(false);
    setShowCompare(false);
    setCompare([]);
    setScreen("intake");
  }
  async function recommend() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy("advisor");
    setError("");
    token.current = null;
    setActivity(null);
    setRecommendation(null);
    setJourney(null);
    setEdited(null);
    setSelected(null);
    const request: Teacher = {
      ...teacher,
      learning_goal: teacher.learning_goal.trim(),
      preferences: teacher.preferences.map((s) => s.trim()).filter(Boolean),
      required_standards: teacher.required_standards
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      const { workflow_token, ...response } = await api.recommend(request);
      token.current = workflow_token;
      setSubmitted(structuredClone(request));
      setRecommendation(response);
      setCompare(visibleCandidates(response).map((c) => c.program_id));
      setScreen("discovery");
      setHealth("online");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }
  function select(c: Candidate) {
    if (journey) {
      setError(
        "This session already has a learning plan. Open Learning Journey to edit it, or start a new search to choose a different program.",
      );
      return;
    }
    setSelected(c);
    setAck(false);
    setError("");
    setScreen("selection");
  }
  async function design() {
    if (inFlight.current || !recommendation || !selected || !token.current)
      return;
    inFlight.current = true;
    setBusy("designer");
    setError("");
    setActivity(null);
    try {
      const response = await api.journey(
        recommendation.workflow_id,
        selected.program_id,
        ack,
        token.current,
      );
      setJourney(response);
      setEdited(teachingContent(response.ai_teaching_suggestions));
      setSnapshot(snapshotProgram(response, submitted!));
      setRestored(null);
      drafts.beginNew();
      setInquiry(
        inquiryDraft(response.museum_facts, response.eligibility, submitted!),
      );
      setNotes("");
      setReviewed(false);
      setScreen("journey");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  }
  const candidates = recommendation ? visibleCandidates(recommendation) : [];
  const step =
    screen === "intake"
      ? 0
      : screen === "discovery"
        ? 1
        : screen === "selection"
          ? 2
          : screen === "journey"
            ? 3
            : 4;
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="site-header no-print">
        <a className="brand" href="#main">
          <Compass />
          <div>
            <strong>Whitney Learning Compass</strong>
            <span>From Curriculum Goals to Hands-On Discovery</span>
          </div>
        </a>
        <div className="header-meta">
          <span className={"connection " + health}>
            <i />
            {health === "online"
              ? "Local service connected"
              : health === "checking"
                ? "Connecting…"
                : "Local service unavailable"}
          </span>
          <span>INDEPENDENT EDUCATIONAL PROTOTYPE</span>
        </div>
      </header>
      <div className="workspace">
        <aside className="sidebar no-print">
          <span className="eyebrow">YOUR PLANNING COMPASS</span>
          <div className="mobile-progress">
            <div>
              <span>{restored ? "Saved local document" : `Step ${step + 1} of 5`}</span>
              <strong>{stepLabels[step]}</strong>
            </div>
            <button
              className="text-button"
              aria-expanded={mobileSteps}
              aria-controls="planning-navigation"
              onClick={() => setMobileSteps(!mobileSteps)}
            >
              {mobileSteps ? "Hide steps" : "Show steps"}
            </button>
            {!restored && <progress max={5} value={step + 1} aria-label="Planning progress" />}
          </div>
          <nav
            id="planning-navigation"
            className={mobileSteps ? "mobile-open" : ""}
            aria-label="Planning steps"
          >
            <ol>
              {restored ? ["journey", "review"].map((target) => <li key={target} className={screen === target ? "current" : ""}><button aria-current={screen === target ? "page" : undefined} onClick={() => setScreen(target as Screen)}>{target === "journey" ? "Edit Saved Plan" : "Review & Export"}</button></li>) : stepLabels.map((label, i) => (
                <li
                  key={label}
                  className={
                    step === i ? "current" : step > i ? "complete" : ""
                  }
                >
                  <button
                    aria-current={step === i ? "step" : undefined}
                    disabled={
                      !!busy ||
                      (i === 0 && step > 0) ||
                      (i === 1 && !recommendation) ||
                      (i === 2 && (!selected || !!journey)) ||
                      (i >= 3 && !journey)
                    }
                    onClick={() =>
                      setScreen(
                        (
                          [
                            "intake",
                            "discovery",
                            "selection",
                            "journey",
                            "review",
                          ] as Screen[]
                        )[i],
                      )
                    }
                  >
                    <span>
                      {step > i ? "✓" : String(i + 1).padStart(2, "0")}
                    </span>
                    {label}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <div className="sidebar-note">
            <Compass />
            <h3>
              Good questions.
              <br />
              Hands-on discovery.
            </h3>
            <p>Real programs. Visible evidence. Your teaching judgment.</p>
            <a
              href="https://www.eliwhitney.org/workshop/school-programs"
              target="_blank"
              rel="noreferrer"
            >
              Explore the museum catalog ↗
            </a>
            {catalogCount !== null && (
              <p className="hint">
                {catalogCount} curated local program records
              </p>
            )}
          </div>
          {step > 0 && (
            <button
              className="text-button restart"
              disabled={!!busy}
              onClick={restart}
            >
              {restored ? "Start New Plan" : "Start a new search"}
            </button>
          )}
          <p className="sidebar-fine">
            AI sessions end on refresh. Saved instructional drafts can be recovered on this device.
          </p>
        </aside>
        <main id="main">
          {screen === "intake" && !recoveryDismissed && (drafts.stored.draft || drafts.stored.problem) && <section className="panel draft-recovery no-print" aria-label="Saved learning plan recovery">
            <span className="eyebrow">CONTINUE YOUR TEACHING PLAN</span>
            <h2>{drafts.stored.draft ? "You have a saved learning plan" : "Your saved draft is unavailable"}</h2>
            {drafts.stored.draft ? <p>{drafts.stored.draft.program.name} · Grade(s) {gradeLabel(drafts.stored.draft.teacher.grades)} · Last edited {draftDate(drafts.stored.draft.edited_at)}</p> : <p>{drafts.stored.problem === "invalid" ? "This saved copy could not be read. It may be damaged or from an unsupported version. You can delete it and start fresh." : "Browser storage is unavailable. You can still plan and print; local recovery is not available."}</p>}
            <p className="hint">{DRAFT_PRIVACY}</p>
            <div className="draft-actions">
              {drafts.stored.draft && <button className="primary action-accent" onClick={restoreDraft}>Restore Draft</button>}
              <button className="secondary" onClick={() => setRecoveryDismissed(true)}>Start Fresh</button>
              {drafts.stored.raw !== null && <button className="text-button" onClick={deleteDraft}>Delete Saved Draft</button>}
            </div><p className="hint">Starting fresh keeps the saved copy until you choose to replace or delete it.</p>
          </section>}
          {payload && <section className="panel draft-toolbar no-print" aria-label="Local draft saving">
            <p aria-live="polite"><strong>{drafts.status === "saving" ? "Saving…" : drafts.status === "saved" && drafts.stored.draft ? `Saved on this device · ${draftDate(drafts.stored.draft.edited_at)}` : drafts.status === "error" ? "Could not save locally. Please print a copy before leaving." : drafts.status === "replacement" ? "Another learning plan is already saved. Saving this plan will replace it." : drafts.status === "conflict" ? "The saved draft changed in another tab. Saving is paused to protect both versions." : drafts.status === "deleted" ? "Saved copy deleted. Your open plan remains; automatic saving is paused." : "Local saving is paused."}</strong></p>
            <p className="hint">{DRAFT_PRIVACY}</p>
            <div className="draft-actions">
              {!drafts.enabled && <button className="secondary" onClick={saveThisPlan}>{drafts.stored.raw !== null ? "Replace Saved Draft" : "Save This Plan on This Device"}</button>}
              {drafts.status === "conflict" && drafts.stored.draft && <button className="secondary" onClick={restoreDraft}>Restore Saved Copy</button>}
              {drafts.stored.raw !== null && <button className="text-button" onClick={deleteDraft}>Delete Saved Draft</button>}
            </div>
          </section>}
          {!payload && drafts.status === "error" && <p className="note warning no-print">Could not access or change the saved copy. Please print your plan and check browser storage permissions.</p>}
          {!payload && drafts.status === "deleted" && <p className="note no-print" aria-live="polite">Saved copy deleted from this browser.</p>}

          <div
            ref={headingRef}
            tabIndex={-1}
            className="focus-anchor"
            role="group"
            aria-label={
              [
                "Teaching goal",
                "Discover programs",
                "Review selection",
                "Learning journey",
                "Review plan",
              ][step]
            }
          />
          {error && (
            <div className="error no-print" role="alert">
              <strong>Let’s get your planning back on track.</strong>
              <p>{error}</p>
              <button className="secondary" onClick={restart} disabled={!!busy}>
                Return to requirements / new search
              </button>
            </div>
          )}
          {busy && (
            <section
              className="loading panel no-print"
              role="status"
              aria-live="polite"
            >
              <span className="spinner" />
              <div>
                <h2>
                  {busy === "advisor"
                    ? "Finding connections for your class…"
                    : "Designing your learning journey…"}
                </h2>
                <p>
                  {busy === "advisor"
                    ? "Checking published requirements, then exploring educational fit."
                    : "Using your selected program and verified facts to draft three phases."}{" "}
                  This can take up to 90 seconds.
                </p>
                <small>
                  No booking is being made. Please keep this tab open.
                </small>
              </div>
            </section>
          )}
          {screen === "intake" && (
            <>
              <section className="hero">
                <div>
                  <span className="eyebrow">CURRICULUM MEETS CURIOSITY</span>
                  <h1>
                    Turn a teaching goal
                    <br />
                    into a <em>discovery.</em>
                  </h1>
                  <p>
                    Find a hands-on museum workshop that fits your class. <br />
                    Then connect the visit to what happens before and after.
                  </p>
                  <div className="hero-tags">
                    <span>Verified program facts</span>
                    <span>You choose the journey</span>
                  </div>
                </div>
                <div className="workshop-art" aria-hidden="true">
                  <svg viewBox="0 0 240 200">
                    <path d="M20 168h200M32 171V38M30 40h170" />
                    <circle cx="157" cy="64" r="29" />
                    <path d="m57 154 50-89 50 89Zm15-25h70M107 65v89M57 154h109M47 177h128" />
                    <path className="accent" d="m157 44 11 19-11 20-11-20Z" />
                    <circle className="dot" cx="107" cy="65" r="6" />
                    <circle className="dot" cx="57" cy="154" r="6" />
                    <circle className="dot" cx="157" cy="154" r="6" />
                    <path strokeDasharray="3 6" d="M107 34v145M14 106h203" />
                  </svg>
                  <span>OBSERVE · QUESTION · BUILD</span>
                </div>
              </section>
              <div className="intake-layout">
                <section className="panel intake-panel">
                  <Intake
                    value={teacher}
                    onChange={setTeacher}
                    onSubmit={recommend}
                    busy={!!busy}
                  />
                </section>
                <aside className="planning-note">
                  <span className="eyebrow">A THOUGHTFUL START</span>
                  <h3>
                    Plan the learning.
                    <br />
                    Confirm the logistics.
                  </h3>
                  <p>
                    Published grades, fees and duration guide program
                    eligibility.
                  </p>
                  <p>
                    Availability, capacity and accommodations still need a
                    conversation with the museum.
                  </p>
                  <div className="small-rule" />
                  <p>
                    Suggestions are a starting point for your professional
                    judgment, not official museum curriculum.
                  </p>
                </aside>
              </div>
            </>
          )}
          {screen === "discovery" && recommendation && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">POSSIBILITIES WITH PURPOSE</span>
                  <h1>Find your class’s next discovery.</h1>
                  <p>{recommendation.interpreted_goal}</p>
                </div>
              </div>
              <div className="request-strip">
                Grade(s) {gradeLabel(submitted!.grades)} <span>·</span>{" "}
                {submitted!.student_count} students <span>·</span>{" "}
                {limitSummary(submitted!)}
              </div>
              {candidates.length === 0 ? (
                <section className="panel empty-state">
                  <span className="eyebrow">
                    NO SHORTCUTS AROUND YOUR REQUIREMENTS
                  </span>
                  <h2>No suitable recommendation was returned.</h2>
                  <p>
                    Your requirements have not been relaxed. Review the actual
                    checks below, then adjust only the limits that are flexible
                    for your class.
                  </p>
                  <button className="primary" onClick={restart}>
                    Review my requirements
                  </button>
                </section>
              ) : (
                <>
                  <p className="note">
                    Program eligibility is separate from booking. Capacity,
                    dates and other arrangements remain unconfirmed. Currency
                    assumptions are shown with each subtotal.
                  </p>
                  <div className="discovery-toolbar">
                    <p>
                      {
                        candidates.filter((c) => c.category === "eligible")
                          .length
                      }{" "}
                      meeting program requirements ·{" "}
                      {
                        candidates.filter((c) => c.category === "provisional")
                          .length
                      }{" "}
                      provisional
                    </p>
                    <button
                      className="secondary"
                      disabled={compare.length < 2}
                      onClick={() => setShowCompare(!showCompare)}
                    >
                      {showCompare
                        ? "Hide Comparison"
                        : `Compare Programs (${compare.length})`}
                    </button>
                  </div>
                  {showCompare && (
                    <Comparison
                      candidates={candidates.filter((c) =>
                        compare.includes(c.program_id),
                      )}
                      onSelect={select}
                    />
                  )}
                  {(["eligible", "provisional"] as const).map((category) => {
                    const group = candidates.filter(
                      (c) => c.category === category,
                    );
                    return (
                      group.length > 0 && (
                        <section
                          key={category}
                          className={
                            category === "provisional"
                              ? "provisional-group"
                              : ""
                          }
                        >
                          <h2 className="group-title">
                            {category === "eligible"
                              ? "Programs that meet your requirements"
                              : "Provisional options · confirmation needed"}
                          </h2>
                          {category === "provisional" && (
                            <p>
                              These options have unresolved mandatory
                              requirements and can support only a provisional
                              plan.
                            </p>
                          )}
                          <div className="program-grid">
                            {group.map((c) => (
                              <ProgramCard
                                key={c.program_id}
                                candidate={c}
                                index={candidates.indexOf(c)}
                                selectedForCompare={compare.includes(
                                  c.program_id,
                                )}
                                onCompare={() =>
                                  setCompare(
                                    compare.includes(c.program_id)
                                      ? compare.filter(
                                          (id) => id !== c.program_id,
                                        )
                                      : [...compare, c.program_id].slice(0, 3),
                                  )
                                }
                                onSelect={() => select(c)}
                              />
                            ))}
                          </div>
                        </section>
                      )
                    );
                  })}
                </>
              )}
              <CatalogChecks matches={recommendation.eligibility_results} />
            </>
          )}
          {screen === "selection" && selected && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">THE CHOICE IS YOURS</span>
                  <h1>A moment to review your selection.</h1>
                  <p>
                    Check the program and open questions before requesting your
                    learning plan.
                  </p>
                </div>
              </div>
              <section className="panel">
                <StatusBadge status={selected.eligibility.eligibility_status} />
                <h2>{selected.museum_facts.official_name}</h2>
                <p>{selected.ai_educational_reasoning}</p>
                <FactGrid
                  facts={selected.museum_facts}
                  match={selected.eligibility}
                />
                <SourceDetails facts={selected.museum_facts} />
              </section>
              <ConfirmationSections
                facts={selected.museum_facts}
                match={selected.eligibility}
                teacher={submitted!}
              />
              {selected.category === "provisional" && (
                <div className="note warning">
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={ack}
                      onChange={(e) => setAck(e.target.checked)}
                    />
                    <span>
                      I acknowledge the unresolved mandatory requirements and
                      want a provisional planning draft. This does not confirm
                      eligibility or bookability.
                    </span>
                  </label>
                </div>
              )}
              <div className="selection-actions">
                <button
                  className="secondary"
                  disabled={!!busy}
                  onClick={() => setScreen("discovery")}
                >
                  Back to Programs
                </button>
                <button
                  className="primary action-accent"
                  disabled={
                    !!busy ||
                    !!journey ||
                    (selected.category === "provisional" && !ack)
                  }
                  onClick={design}
                >
                  Generate Learning Journey
                </button>
              </div>
              <p className="hint">
                This deliberate action runs the Learning Journey Designer once.
                Booking is not supported.
              </p>
            </>
          )}
          {(screen === "journey" || screen === "review") &&
            (journey || restored) &&
            edited &&
            submitted && (
              <LearningPlan
                journey={journey ?? undefined}
                saved={restored ?? undefined}
                teacher={submitted}
                edited={edited}
                onEdit={setEdited}
                notes={notes}
                onNotes={setNotes}
                reviewed={reviewed}
                onReviewed={setReviewed}
                inquiry={inquiry}
                onInquiry={setInquiry}
                review={screen === "review"}
                onReview={(v) => setScreen(v ? "review" : "journey")}
              />
            )}
          {recommendation && (
            <details className="activity no-print">
              <summary>Planning activity</summary>
              <p>
                Optional execution summary. No student records or private
                workflow tokens are shown.
              </p>
              <button
                className="text-button"
                onClick={async () => {
                  setActivityError("");
                  try {
                    setActivity(
                      await api.activity(
                        journey?.run_id ?? recommendation.run_id,
                        token.current!,
                      ),
                    );
                  } catch {
                    setActivityError(
                      "Activity is unavailable. Your visible plan is still available to review and print.",
                    );
                  }
                }}
              >
                Load latest activity
              </button>
              {activityError && <p role="status">{activityError}</p>}
              {activity && (
                <p>
                  {activity.agent} ·{" "}
                  {activity.output_validation === "passed"
                    ? "Output checks passed"
                    : "Output not validated"}{" "}
                  ·{" "}
                  {activity.tools
                    .map((t) => t.tool.replaceAll("_", " "))
                    .join(", ")}{" "}
                  · {activity.model_request_count} model requests ·{" "}
                  {activity.latency_seconds}s. Reported tokens:{" "}
                  {activity.usage.input_tokens ?? "unknown"} input,{" "}
                  {activity.usage.cached_input_tokens ?? "unknown"} cached
                  input, {activity.usage.output_tokens ?? "unknown"} output.
                </p>
              )}
            </details>
          )}
          <footer className="site-footer no-print">
            <p>{DISCLAIMER}</p>
            <span>MADE FOR CURIOUS CLASSROOMS</span>
          </footer>
        </main>
      </div>
    </>
  );
}
