import { useState } from "react";
import type { Match, Status } from "../types";
import { constraintExplanation, unresolvedChecks } from "../evidence";
import { safeUrl } from "../presentation";

function Group({ matches, title }: { matches: Match[]; title: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <details className="check-group">
      <summary>
        {title} ({matches.length})
      </summary>
      {matches.length === 0 && (
        <p>No programs in this group for your stated requirements.</p>
      )}
      {matches.slice(0, expanded ? matches.length : 5).map((m) => (
        <div className="check-row" key={m.program_id}>
          <h3>{m.official_name}</h3>
          <p>
            {unresolvedChecks(m).join(" ") ||
              "Published information meets your applicable requirements. Booking and unpublished details still require confirmation."}
          </p>
          <details>
            <summary>Why this decision?</summary>
            <ul>
              {m.hard_constraints.map((c, i) => (
                <li key={i}>
                  {constraintExplanation(c)}
                  {c.assumption && " " + c.assumption}
                </li>
              ))}
            </ul>
          </details>
          <a href={safeUrl(m.official_url)} target="_blank" rel="noreferrer">
            Official museum program page ↗
          </a>
        </div>
      ))}
      {matches.length > 5 && (
        <button className="text-button" onClick={() => setExpanded(!expanded)}>
          {expanded
            ? "Show fewer programs"
            : `Show all ${matches.length} programs in this group`}
        </button>
      )}
    </details>
  );
}
export default function CatalogChecks({ matches }: { matches: Match[] }) {
  const groups: [Status, string][] = [
    ["pass", "Programs meeting applicable requirements"],
    ["unknown", "Programs requiring confirmation"],
    ["fail", "Programs not meeting requirements"],
  ];
  return (
    <details className="panel all-checks">
      <summary>How were programs checked?</summary>
      <p>
        We checked published grade information, program fees, duration, and any
        requirements you specified. Missing information is kept as unconfirmed
        rather than assumed.
      </p>
      <p>
        These checks do not establish educational fit or booking availability. A
        program may meet your stated requirements while some details remain
        unpublished.
      </p>
      {groups.map(([status, title]) => (
        <Group
          key={status}
          title={title}
          matches={matches.filter((m) => m.eligibility_status === status)}
        />
      ))}
    </details>
  );
}
