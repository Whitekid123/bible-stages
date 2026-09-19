import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StudentShell } from "@/components/student-shell";
import { useStudentGate } from "@/components/student-gate";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import { parishOf } from "@/lib/bible/desk";

export const Route = createFileRoute("/parish/prayer")({ component: PrayerLamp });

function PrayerLamp() {
  const session = useStudentGate();
  const patchParish = useAppStore((s) => s.patchParish);
  const prayers = parishOf(useAppStore((s) => s.desk)).prayers;
  const [text, setText] = useState("");

  if (!session) return null;

  function add() {
    const line = text.trim();
    if (line.length < 3) return;
    patchParish((p) => ({
      ...p,
      prayers: [
        { id: `pr-${Date.now().toString(36)}`, text: line.slice(0, 240), at: new Date().toISOString() },
        ...p.prayers,
      ].slice(0, 24),
      stars: p.stars + 1,
    }));
    setText("");
  }

  return (
    <StudentShell>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">Lamp of prayer</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">A short ask</h1>
      <p className="mt-3 text-muted">Keep it on this phone. Teacher cannot read these.</p>
      <textarea
        className="mt-6 min-h-28 w-full rounded-xl border border-border bg-bg-elevated p-4"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Thank You for… Help me to…"
      />
      <Button className="mt-3" onClick={add} disabled={text.trim().length < 3}>
        Keep this prayer
      </Button>
      <ul className="mt-8 space-y-3">
        {prayers.map((item) => (
          <li key={item.id} className="rounded-xl bg-bg-elevated p-4 shadow-lift">
            <p>{item.text}</p>
            <p className="mt-1 text-xs text-muted">{new Date(item.at).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </StudentShell>
  );
}
