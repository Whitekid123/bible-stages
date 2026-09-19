import { answersMatch } from "@/lib/utils";
import { resolveQuestion } from "@/lib/bible/pack";
import type { Paper, Question } from "@/lib/bible/types";

export function scorePaper(paper: Paper, custom: Question[] = []) {
  let objectiveCorrect = 0;
  let objectiveTotal = 0;
  let blankCorrect = 0;
  let blankTotal = 0;
  let blankMarked = 0;

  for (const id of paper.questionIds) {
    const q = resolveQuestion(id, paper, custom);
    if (!q) continue;
    const given = paper.answers[id] ?? "";
    const canAuto = Boolean(q.answer);
    if (q.section === "objective") {
      objectiveTotal += 1;
      if (canAuto && answersMatch(given, q.answer, q.aliases)) objectiveCorrect += 1;
    } else {
      blankTotal += 1;
      const mark = paper.blankMarks[id];
      if (mark === "correct") {
        blankCorrect += 1;
        blankMarked += 1;
      } else if (mark === "wrong") {
        blankMarked += 1;
      } else if (canAuto && answersMatch(given, q.answer, q.aliases)) {
        blankCorrect += 1;
      }
    }
  }

  const total = objectiveTotal + blankTotal;
  const correct = objectiveCorrect + blankCorrect;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  return {
    objectiveCorrect,
    objectiveTotal,
    blankCorrect,
    blankTotal,
    blankMarked,
    correct,
    total,
    percent,
  };
}

export function integrityLabel(tabLeaves: number, appLeaves = 0) {
  const n = tabLeaves + appLeaves;
  if (n <= 0) return { label: "Clean sitting", tone: "ok" as const };
  if (appLeaves > 0 && tabLeaves === 0) {
    return {
      label: `Left the app ${appLeaves} time${appLeaves === 1 ? "" : "s"}`,
      tone: appLeaves > 2 ? ("danger" as const) : ("warn" as const),
    };
  }
  if (n <= 2) return { label: `${n} leave${n === 1 ? "" : "s"}`, tone: "warn" as const };
  return { label: `Integrity flag · ${n} leaves`, tone: "danger" as const };
}

export function scoreBand(percent: number) {
  if (percent >= 85) return { label: "Distinction", tone: "ok" as const };
  if (percent >= 70) return { label: "Credit", tone: "ok" as const };
  if (percent >= 50) return { label: "Pass", tone: "warn" as const };
  return { label: "Below pass", tone: "danger" as const };
}
