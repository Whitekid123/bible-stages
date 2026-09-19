export type StageId = "general" | "little" | "growing" | "juniors" | "youth";

export type SectionId = "objective" | "blank";

export type BankMode = "builtin" | "mix" | "custom";

export type Question = {
  id: string;
  stage: StageId;
  section: SectionId;
  prompt: string;
  options: string[];
  answer: string;
  aliases: string[];
  reference?: string;
  source?: "builtin" | "lecturer";
  published?: boolean;
};

export type StageInfo = {
  id: StageId;
  roman: string;
  name: string;
  ages: string;
  blurb: string;
  objectiveCount: number;
  blankCount: number;
};

export type ExamSize = 20 | 40 | "full";

export type HallMeta = {
  examSize: ExamSize;
  notice: string;
  sittingOpen: boolean;
  bankMode: BankMode;
  packVersion: number;
  practiceOpen: boolean;
  releaseMarks: boolean;
};

export type QuestionPack = {
  version: number;
  downloadedAt: string;
  questions: Question[];
};

export type Settings = {
  examSize: ExamSize;
};

export type ScoreSummary = {
  correct: number;
  total: number;
  percent: number;
};

export type Paper = {
  id: string;
  studentName: string;
  stageId: StageId;
  questionIds: string[];
  answers: Record<string, string>;
  tabLeaves: number;
  appLeaves?: number;
  hidden?: boolean;
  lastSeen?: string;
  startedAt: string;
  submittedAt: string | null;
  timeUp: boolean;
  durationSec: number;
  teacherNotes: string;
  blankMarks: Record<string, "correct" | "wrong" | "unset">;
  /** Snapshot of the sitting so later bank edits do not change a handed-in paper. */
  questions?: Question[];
  scoreCache?: ScoreSummary;
  /** Local only: hand-in is queued until the hall confirms receipt. */
  pendingSubmit?: boolean;
  flagged?: string[];
  extraSec?: number;
};

export type SeatWatch = {
  name: string;
  role: "student" | "teacher";
  paperId: string | null;
  stageId: StageId | null;
  inExam: boolean;
  hidden: boolean;
  appLeaves: number;
  tabLeaves: number;
  answersSaved: number;
  lastSeen: string;
};

export type Session =
  | { role: "student"; name: string; password: string }
  | { role: "teacher"; name: "Teacher"; password: string };

export type Bookmark = {
  questionId: string;
  stageId: StageId;
  prompt: string;
  answer: string;
  reference?: string;
  savedAt: string;
};

export type NotebookItem = {
  questionId: string;
  stageId: StageId;
  prompt: string;
  given: string;
  answer: string;
  reference?: string;
  at: string;
};

export type PracticeLog = {
  id: string;
  stageId: StageId;
  correct: number;
  total: number;
  percent: number;
  at: string;
};

export type HonourRow = {
  paperId: string;
  name: string;
  stageId: StageId;
  percent: number;
  correct: number;
  total: number;
  submittedAt: string;
};

import type { ParishDesk } from "@/lib/parish/content";

export type StudentDesk = {
  bookmarks: Bookmark[];
  notebook: NotebookItem[];
  practiceLog: PracticeLog[];
  knownCount: number;
  learningCount: number;
  knownVerses: string[];
  lastVisitDate: string | null;
  streak: number;
  parish?: ParishDesk;
};

export type RevisionCard = {
  id: string;
  prompt: string;
  answer: string;
  reference?: string;
  section: SectionId;
  stage: StageId;
};
