import { render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { PublishedGrades } from "./components/PublishedGrades";
import { Comparison, FactGrid, ProgramCard } from "./components/ProgramDetails";
import { normal } from "./test/fixtures";
import catalog from "../../data/programs.json";

it("preserves published labels and order, including K and open-ended 7+", () => {
  const labels = ["K", "1", "2", "3", "4", "5", "6", "7+"];
  render(<PublishedGrades labels={labels} />);
  const list = screen.getByRole("list", { name: "Published grades" });
  expect(within(list).getAllByRole("listitem").map((el) => el.textContent)).toEqual(labels);
  expect(within(list).queryByRole("button")).not.toBeInTheDocument();
  expect(list).not.toHaveTextContent(/eligible|pass|fail|verified/i);
});

it.each([null, []])("does not fabricate badges for missing published grades (%s)", (labels) => {
  render(<PublishedGrades labels={labels} />);
  expect(screen.getByText("Not published")).toBeInTheDocument();
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});

it("preserves an unfamiliar source label without expanding or normalizing it", () => {
  render(<PublishedGrades labels={["PreK", "Source-specific label"]} />);
  expect(screen.getAllByRole("listitem").map((el) => el.textContent)).toEqual(["PreK", "Source-specific label"]);
});

it("renders each of the twenty catalog records' grade labels unchanged", () => {
  expect(catalog.programs).toHaveLength(20);
  for (const program of catalog.programs) {
    const { unmount } = render(<PublishedGrades labels={program.grade_levels} />);
    expect(screen.getAllByRole("listitem").map((el) => el.textContent)).toEqual(program.grade_levels);
    unmount();
  }
});

it("uses the same published badges in cards and full selection/journey facts", () => {
  const candidate = normal.recommendations[0];
  const { unmount } = render(<ProgramCard candidate={candidate} index={0} selectedForCompare={false} onSelect={() => {}} onCompare={() => {}} />);
  expect(screen.getByRole("list", { name: "Published grades" })).toHaveTextContent("7+");
  expect(screen.getByText("Program Requirements Met")).toBeInTheDocument();
  expect(screen.getByText("USD 336.00")).toBeInTheDocument();
  unmount();
  render(<FactGrid facts={candidate.museum_facts} match={candidate.eligibility} />);
  expect(screen.getAllByRole("listitem").map((el) => el.textContent)).toEqual(candidate.museum_facts.grade_levels);
});

it("keeps identical labels in desktop and mobile comparison and explicit selection intact", async () => {
  const candidate = normal.recommendations[0], onSelect = vi.fn();
  render(<Comparison candidates={[candidate]} onSelect={onSelect} />);
  const lists = screen.getAllByRole("list", { name: "Published grades" });
  expect(lists).toHaveLength(2);
  for (const list of lists) expect(within(list).getAllByRole("listitem").map((el) => el.textContent)).toEqual(candidate.museum_facts.grade_levels);
  expect(onSelect).not.toHaveBeenCalled();
  await userEvent.click(within(screen.getByRole("region", { name: "Program comparison by attribute" })).getByRole("button", { name: "Select Catapult" }));
  expect(onSelect).toHaveBeenCalledExactlyOnceWith(candidate);
});
