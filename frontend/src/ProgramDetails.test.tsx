import { render, screen } from "@testing-library/react";
import { it, expect } from "vitest";
import {
  FactGrid,
  ConfirmationSections,
  SourceDetails,
} from "./components/ProgramDetails";
import { request, provisional, journey } from "./test/fixtures";
import catalog from "../../data/programs.json";
import type { Facts } from "./types";
it("keeps Bridges duration visibly unpublished", () => {
  const c = provisional.provisional_options[0];
  render(<FactGrid facts={c.museum_facts} match={c.eligibility} />);
  expect(screen.getByText("Not published")).toBeInTheDocument();
});
it("keeps Resourceful Schools session ambiguity as a confirmation question and important note", () => {
  const facts = catalog.programs.find(
    (p) => p.id === "ewm-resourceful-schools",
  ) as unknown as Facts;
  render(
    <ConfirmationSections
      facts={facts}
      match={journey.eligibility}
      teacher={request}
    />,
  );
  expect(
    screen.getByText(
      "How do the published duration and per-student fee apply to the recommended two sessions?",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/The time field publishes 2.00 hours/),
  ).toBeInTheDocument();
});
it("keeps the verification date out of the safety section", () => {
  render(
    <ConfirmationSections
      facts={journey.museum_facts}
      match={journey.eligibility}
      teacher={request}
    />,
  );
  expect(
    screen
      .getByRole("heading", { name: "Safety & Important Notes" })
      .closest("section"),
  ).not.toHaveTextContent("Manual live official-page review");
});
it("shows review date, source link, and unpublished standards under verification", () => {
  render(<SourceDetails facts={journey.museum_facts} />);
  expect(screen.getByText(/Source review: 2026-10-21/)).toBeInTheDocument();
  expect(
    screen.getByText(/Program-specific curriculum standards/),
  ).toHaveTextContent("Not published");
  expect(screen.getByText("Official museum program page ↗")).toHaveAttribute(
    "href",
    "https://www.eliwhitney.org/catapult",
  );
});
