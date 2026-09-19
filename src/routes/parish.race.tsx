import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { StudentShell } from "@/components/student-shell";
import { useStudentGate } from "@/components/student-gate";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import { parishOf } from "@/lib/bible/desk";
import { KID_QUIZ } from "@/lib/parish/content";
import { hashString, seededRng, shuffle } from "@/lib/utils";

export const Route = createFileRoute("/parish/race")({ component: RacePage });

function RacePage() {
  const session = useStudentGate();
  const patchParish = useAppStore((s) => s.patchParish);
  const best = parishOf(useAppStore((s) => s.desk)).bestRace;
  const quiz = useMemo(() => shuffle(KID_QUIZ, seededRng(hashString("race-v1"))).slice(0, 10), []);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const current = quiz[i];

  if (!session) return null;

  function pick(option: string) {
    if (!current || done) return;
    const nextScore = score + (option === current.answer ? 1 : 0);
    if (i + 1 >= quiz.length) {
      setScore(nextScore);
      setDone(true);
      patchParish((p) => ({
        ...p,
        bestRace: Math.max(p.bestRace, nextScore),
        stars: p.stars + nextScore,
      }));
      return;
    }
    setScore(nextScore);
    setI((n) => n + 1);
  }

  return (
    <StudentShell>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">Verse race</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Ten quick ones</h1>
      <p className="mt-2 text-muted">Best {best} · Now {score}</p>

      {done || !current ? (
        <div className="mt-8 rounded-xl bg-bg-elevated p-6 shadow-lift">
          <p className="font-display text-3xl">{score} / {quiz.length}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Race again
          </Button>
        </div>
      ) : (
        <div className="mt-8">
          <p className="text-sm text-muted">
            {i + 1} of {quiz.length}
          </p>
          <h2 className="mt-2 font-display text-2xl">{current.prompt}</h2>
          <div className="mt-5 grid gap-2">
            {current.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => pick(option)}
                className="min-h-12 rounded-md border border-border bg-bg-elevated px-4 text-left hover:border-border-strong"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </StudentShell>
  );
}
