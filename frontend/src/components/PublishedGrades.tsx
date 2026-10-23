import type { Facts } from "../types";

/** Published labels only. Colors are presentation, never eligibility logic. */
export function PublishedGrades({ labels }: { labels: Facts["grade_levels"] }) {
  if (!labels?.length) return <span>Not published</span>;
  return (
    <ul className="published-grades" aria-label="Published grades" role="list">
      {labels.map((label, index) => (
        <li className="published-grade" data-grade={label} key={`${label}-${index}`}>
          {label}
        </li>
      ))}
    </ul>
  );
}
