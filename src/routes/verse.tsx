import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { StudentShell } from "@/components/student-shell";
import { SpeakButton } from "@/components/speak-button";
import { useStudentGate } from "@/components/student-gate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/app-store";
import { hashString, seededRng } from "@/lib/utils";
import { verseOfTheDay, verseWords, utcDayKey } from "@/lib/bible/verses";

export const Route = createFileRoute("/verse")({ component: VersePage });

function VersePage() {
  const session = useStudentGate();
  const rememberVerse = useAppStore((s) => s.rememberVerse);
  const knownVerses = useAppStore((s) => s.desk.knownVerses);
  const verse = verseOfTheDay();
  const words = verseWords(verse.text);
  const hidden = useMemo(() => {
    const list = verseWords(verse.text);
    const rand = seededRng(hashString(`hide-${utcDayKey()}-${verse.id}`));
    const count = Math.max(2, Math.round(list.length * 0.35));
    const idx = list.map((_, i) => i).sort(() => rand() - 0.5).slice(0, count);
    return new Set(idx);
  }, [verse.id, verse.text]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(false);
  const saved = knownVerses.includes(verse.id);

  if (!session) return null;

  function reveal(i: number) {
    setRevealed((prev) => new Set(prev).add(i));
  }

  return (
    <StudentShell>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">Memory verse</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{verse.reference}</h1>
      <p className="mt-2 text-muted">{verse.note} · Tap a blank to uncover a word.</p>

      <div className="mt-8 rounded-xl bg-accent p-6 text-accent-fg shadow-lift">
        <div className="flex flex-wrap gap-2">
          {words.map((word, i) => {
            const isHidden = hidden.has(i) && !revealed.has(i) && !open;
            return (
              <button
                key={`${word}-${i}`}
                type="button"
                onClick={() => reveal(i)}
                className={
                  isHidden
                    ? "min-h-10 min-w-16 rounded-md bg-accent-fg/15 px-2 text-sm tracking-[0.2em] text-accent-fg/80"
                    : "min-h-10 rounded-md px-1 font-display text-xl italic"
                }
              >
                {isHidden ? "____" : word}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <SpeakButton text={`${verse.reference}. ${verse.text}`} label="Hear the verse" />
        <Button variant="outline" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide words again" : "Reveal the verse"}
        </Button>
        <Button
          onClick={() => rememberVerse(verse.id)}
          disabled={saved}
        >
          {saved ? (
            <>
              <Check className="size-4" />
              Kept
            </>
          ) : (
            "I know this today"
          )}
        </Button>
      </div>
      {saved ? (
        <Badge variant="ok" className="mt-4">
          Added to your known verses
        </Badge>
      ) : null}
    </StudentShell>
  );
}
