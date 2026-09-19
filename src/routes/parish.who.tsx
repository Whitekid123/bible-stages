import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { StudentShell } from "@/components/student-shell";
import { useStudentGate } from "@/components/student-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/app-store";
import { parishOf } from "@/lib/bible/desk";
import { RIDDLES } from "@/lib/parish/content";
import { shuffle, seededRng, hashString, normalizeAnswer } from "@/lib/utils";

export const Route = createFileRoute("/parish/who")({ component: WhoAmI });

function WhoAmI() {
  const session = useStudentGate();
  const patchParish = useAppStore((s) => s.patchParish);
  const best = parishOf(useAppStore((s) => s.desk)).bestWho;
  const deck = useMemo(
    () => shuffle(RIDDLES, seededRng(hashString(`who-${Date.now().toString(36)}`))),
    [],
  );
  const [i, setI] = useState(0);
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [hint, setHint] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!session) return null;
  const current = deck[i];

  function submit() {
    if (!current) return;
    const ok = normalizeAnswer(guess) === normalizeAnswer(current.answer);
    if (!ok) {
      setMsg(`Not quite. It is ${current.answer}.`);
      next(score);
      return;
    }
    setMsg("Yes.");
    next(score + 1);
  }

  function next(nextScore: number) {
    setScore(nextScore);
    setGuess("");
    setHint(false);
    if (i + 1 >= deck.length) {
      setDone(true);
      patchParish((p) => ({
        ...p,
        bestWho: Math.max(p.bestWho, nextScore),
        stars: p.stars + nextScore,
      }));
      return;
    }
    setI((n) => n + 1);
  }

  return (
    <StudentShell>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">Who am I?</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Name the person</h1>
      <p className="mt-2 text-muted">Best: {best} · Now: {score}</p>

      {done || !current ? (
        <div className="mt-8 rounded-xl bg-bg-elevated p-6 shadow-lift">
          <p className="font-display text-3xl">{score} of {deck.length}</p>
          <p className="mt-2 text-muted">Stars added to your parish lamp.</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Play again
          </Button>
        </div>
      ) : (
        <div className="mt-8 rounded-xl bg-bg-elevated p-6 shadow-lift">
          <p className="text-xs text-muted">
            {i + 1} / {deck.length}
          </p>
          <p className="mt-3 font-display text-2xl leading-snug">{current.clue}</p>
          {hint ? <p className="mt-2 text-sm text-muted">Hint: {current.hint}</p> : null}
          {msg ? <p className="mt-2 text-sm">{msg}</p> : null}
          <form
            className="mt-6 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Type the name"
              autoComplete="off"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Guess</Button>
              <Button type="button" variant="outline" onClick={() => setHint(true)}>
                Hint
              </Button>
            </div>
          </form>
        </div>
      )}
    </StudentShell>
  );
}
