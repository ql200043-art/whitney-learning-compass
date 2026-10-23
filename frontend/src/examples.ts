import type { Teacher } from "./types";

// Editable intake only. No recommended IDs, generated plans or provider calls.
export const teachingExamples = [
  {
    title: "Explore Force & Motion",
    grade: 4,
    students: 24,
    budget: 400,
    goal: "I want my fourth-grade students to explore force, motion, and engineering design through hands-on experiments.",
    topics: ["Force and motion", "engineering design", "experimentation"],
  },
  {
    title: "Discover Sustainable Energy",
    grade: 5,
    students: 20,
    budget: 350,
    goal: "I want my students to explore how renewable energy can be captured and used through hands-on design and experimentation.",
    topics: ["Renewable energy", "sustainability", "engineering"],
  },
  {
    title: "Geometry Through Creative Design",
    grade: 2,
    students: 22,
    budget: 350,
    goal: "I want my second-grade students to explore geometric shapes, spatial reasoning, and creative problem-solving through hands-on activities.",
    topics: ["Geometry", "shapes", "creative design"],
  },
];
export function applyExample(
  current: Teacher,
  example: (typeof teachingExamples)[number],
): Teacher {
  return {
    ...current,
    grades: [example.grade],
    student_count: example.students,
    learning_goal: example.goal,
    preferences: [...example.topics],
    max_program_fee: example.budget,
    budget_currency: "USD",
    max_duration_minutes: 90,
    assume_usd: false,
  };
}
