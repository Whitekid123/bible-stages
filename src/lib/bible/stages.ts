import type { ExamSize, StageId, StageInfo } from "./types";

export const STAGES: StageInfo[] = [
  {
    id: "general",
    roman: "I",
    name: "General",
    ages: "All ages",
    blurb: "A mixed paper anyone in the class can sit. Objective questions first.",
    objectiveCount: 200,
    blankCount: 50,
  },
  {
    id: "little",
    roman: "II",
    name: "Little ones",
    ages: "3–5 years",
    blurb: "Short, spoken-aloud questions. God, Jesus, Noah, and simple stories.",
    objectiveCount: 100,
    blankCount: 25,
  },
  {
    id: "growing",
    roman: "III",
    name: "Growing",
    ages: "6–7 years",
    blurb: "Bible stories they already know: David, Jonah, Christmas, Easter.",
    objectiveCount: 100,
    blankCount: 25,
  },
  {
    id: "juniors",
    roman: "IV",
    name: "Juniors",
    ages: "8–9 years",
    blurb: "Books, people, and places — still clear, a little more detail.",
    objectiveCount: 100,
    blankCount: 25,
  },
  {
    id: "youth",
    roman: "V",
    name: "Youth",
    ages: "10–15 years",
    blurb: "Writers, sequence, verses, and the story of Scripture as a whole.",
    objectiveCount: 100,
    blankCount: 25,
  },
];

export function stageById(id: string | undefined): StageInfo | undefined {
  return STAGES.find((stage) => stage.id === id);
}

export function isStageId(id: string): id is StageId {
  return STAGES.some((stage) => stage.id === id);
}

export function examQuestionCount(stage: StageInfo, size: ExamSize) {
  if (size === "full") {
    return { objective: stage.objectiveCount, blank: stage.blankCount };
  }
  if (size === 40) {
    return { objective: 32, blank: 8 };
  }
  return { objective: 16, blank: 4 };
}

export function examMinutes(totalQuestions: number, size: ExamSize) {
  if (size === "full") {
    return Math.max(40, Math.round(totalQuestions * 0.6));
  }
  if (size === 40) return 30;
  return 15;
}
