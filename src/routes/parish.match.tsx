import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { StudentShell } from "@/components/student-shell";
import { useStudentGate } from "@/components/student-gate";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import { parishOf } from "@/lib/bible/desk";
import { PAIRS } from "@/lib/parish/content";
import { hashString, seededRng, shuffle } from "@/lib/utils";

export const Route = createFileRoute("/parish/match")({ component: MatchPage });

type Tile = { key: string; pair: string; label: string };

function MatchPage() {
  const session = useStudentGate();
  const patchParish = useAppStore((s) => s.patchParish);
  const best = parishOf(useAppStore((s) => s.desk)).bestMatch;
  const tiles = useMemo(() => {
    const raw: Tile[] = PAIRS.flatMap((p) => [
      { key: `${p.id}-a`, pair: p.id, label: p.a },
      { key: `${p.id}-b`, pair: p.id, label: p.b },
    ]);
    return shuffle(raw, seededRng(hashString(`match-${raw.length}`)));
  }, []);
  const [open, setOpen] = useState<string[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [saved, setSaved] = useState(false);

  if (!session) return null;

  function tap(key: string) {
    if (done.includes(key) || open.includes(key) || open.length === 2) return;
    const next = [...open, key];
    setOpen(next);
    if (next.length < 2) return;
    setMoves((n) => n + 1);
    const [a, b] = next.map((k) => tiles.find((t) => t.key === k)!);
    window.setTimeout(() => {
      if (a.pair === b.pair) {
        const matched = [...done, a.key, b.key];
        setDone(matched);
        if (matched.length === tiles.length && !saved) {
          setSaved(true);
          const score = Math.max(1, 16 - (moves + 1));
          patchParish((p) => ({
            ...p,
            bestMatch: p.bestMatch ? Math.min(p.bestMatch, moves + 1) : moves + 1,
            stars: p.stars + score,
          }));
        }
      }
      setOpen([]);
    }, 550);
  }

  const complete = done.length === tiles.length;

  return (
    <StudentShell>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">Pair the signs</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Find the match</h1>
      <p className="mt-2 text-muted">
        Moves {moves}
        {best ? ` · Best ${best}` : ""}
      </p>
      <div className="mt-6 grid grid-cols-4 gap-2">
        {tiles.map((tile) => {
          const show = open.includes(tile.key) || done.includes(tile.key);
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => tap(tile.key)}
              className={`flex min-h-16 items-center justify-center rounded-md border px-1 text-center text-sm font-medium transition-colors duration-150 ${
                done.includes(tile.key)
                  ? "border-ok bg-ok/15 text-ok"
                  : show
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border bg-bg-elevated"
              }`}
            >
              {show ? tile.label : "·"}
            </button>
          );
        })}
      </div>
      {complete ? (
        <p className="mt-6 font-display text-2xl">All paired. Stars added.</p>
      ) : (
        <Button className="mt-6" variant="outline" onClick={() => window.location.reload()}>
          Shuffle again
        </Button>
      )}
    </StudentShell>
  );
}
