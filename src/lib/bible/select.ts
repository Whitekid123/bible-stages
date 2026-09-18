import { hashString, pickN, seededRng } from "@/lib/utils";
import { STAGES, examMinutes, examQuestionCount } from "./stages";
import { mergeBank } from "./pack";
import type { BankMode, ExamSize, Question, StageId } from "./types";

export function selectQuestions(
  stageId: StageId,
  size: ExamSize,
  seed: string,
  custom: Question[] = [],
  mode: BankMode = "mix",
) {
  const stage = STAGES.find((s) => s.id === stageId);
  if (!stage) return [];
  const counts = examQuestionCount(stage, size);
  const rand = seededRng(hashString(seed));
  const pool = mergeBank(custom, mode, stageId);
  const objective = pickN(
    pool.filter((q) => q.section === "objective"),
    counts.objective,
    rand,
  );
  const blank = pickN(
    pool.filter((q) => q.section === "blank"),
    counts.blank,
    rand,
  );
  return [...objective, ...blank];
}

export function durationFor(stageId: StageId, size: ExamSize, questionCount: number) {
  return examMinutes(questionCount, size) * 60;
}
