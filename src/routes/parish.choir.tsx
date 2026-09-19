import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StudentShell } from "@/components/student-shell";
import { SpeakButton } from "@/components/speak-button";
import { useStudentGate } from "@/components/student-gate";
import { Button } from "@/components/ui/button";
import { HYMNS } from "@/lib/parish/content";
import { useAppStore } from "@/lib/app-store";

export const Route = createFileRoute("/parish/choir")({ component: ChoirPage });

function ChoirPage() {
  const session = useStudentGate();
  const patchParish = useAppStore((s) => s.patchParish);
  const [hymnId, setHymnId] = useState(HYMNS[0].id);
  const [line, setLine] = useState(0);
  const hymn = HYMNS.find((h) => h.id === hymnId) ?? HYMNS[0];

  if (!session) return null;

  function next() {
    if (line + 1 >= hymn.lines.length) {
      patchParish((p) => ({ ...p, stars: p.stars + 1 }));
      setLine(0);
      return;
    }
    setLine((n) => n + 1);
  }

  return (
    <StudentShell>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">Choir loft</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Follow the line</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {HYMNS.map((h) => (
          <Button
            key={h.id}
            size="sm"
            variant={h.id === hymn.id ? "default" : "outline"}
            onClick={() => {
              setHymnId(h.id);
              setLine(0);
            }}
          >
            {h.title}
          </Button>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <SpeakButton text={hymn.lines.join(" ")} label="Hear the hymn" />
      </div>
      <ol className="mt-4 space-y-2">
        {hymn.lines.map((text, i) => (
          <li
            key={`${hymn.id}-${i}`}
            className={`rounded-xl px-4 py-3 ${
              i === line ? "bg-accent text-accent-fg shadow-lift" : "bg-bg-elevated text-muted"
            }`}
          >
            <span className="font-display text-xl">{text}</span>
          </li>
        ))}
      </ol>
      <Button className="mt-6" onClick={next}>
        {line + 1 >= hymn.lines.length ? "Finish verse" : "Next line"}
      </Button>
    </StudentShell>
  );
}
