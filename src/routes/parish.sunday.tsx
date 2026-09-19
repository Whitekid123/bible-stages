import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { StudentShell } from "@/components/student-shell";
import { useStudentGate } from "@/components/student-gate";
import { useAppStore } from "@/lib/app-store";
import { parishOf } from "@/lib/bible/desk";
import { todayKey } from "@/lib/bible/verses";
import { SUNDAY_ACTS } from "@/lib/parish/content";

export const Route = createFileRoute("/parish/sunday")({ component: SundayTrail });

function SundayTrail() {
  const session = useStudentGate();
  const patchParish = useAppStore((s) => s.patchParish);
  const parish = parishOf(useAppStore((s) => s.desk));
  const day = todayKey();
  const ticked = new Set(parish.sunday[day] ?? []);

  if (!session) return null;

  function toggle(id: string) {
    patchParish((p) => {
      const current = new Set(p.sunday[day] ?? []);
      const had = current.has(id);
      if (had) current.delete(id);
      else current.add(id);
      const next = { ...p.sunday, [day]: [...current] };
      return {
        ...p,
        sunday: next,
        stars: p.stars + (had ? 0 : 1),
      };
    });
  }

  return (
    <StudentShell>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">Sunday trail</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">This day’s walk</h1>
      <p className="mt-3 text-muted">Tick what you actually did. One star each. No pretending.</p>
      <ul className="mt-8 space-y-2">
        {SUNDAY_ACTS.map((act) => {
          const on = ticked.has(act.id);
          return (
            <li key={act.id}>
              <button
                type="button"
                onClick={() => toggle(act.id)}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 text-left ${
                  on ? "border-ok bg-ok/10" : "border-border bg-bg-elevated"
                }`}
              >
                <span
                  className={`grid size-8 place-items-center rounded-sm ${
                    on ? "bg-ok text-accent-fg" : "bg-bg-subtle text-muted"
                  }`}
                >
                  {on ? <Check className="size-4" /> : null}
                </span>
                {act.label}
              </button>
            </li>
          );
        })}
      </ul>
    </StudentShell>
  );
}
