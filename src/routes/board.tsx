import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Lock } from "lucide-react";
import { StudentShell } from "@/components/student-shell";
import { useStudentGate } from "@/components/student-gate";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/app-store";
import { stageById } from "@/lib/bible/stages";
import { scoreBand } from "@/lib/scoring";

export const Route = createFileRoute("/board")({ component: BoardPage });

function BoardPage() {
  const session = useStudentGate();
  const honour = useAppStore((s) => s.honour);
  const fetchHonour = useAppStore((s) => s.fetchHonour);
  const hallMeta = useAppStore((s) => s.hallMeta);

  useEffect(() => {
    if (!session) return;
    void fetchHonour();
  }, [session, fetchHonour]);

  if (!session) return null;

  const open = honour?.open ?? hallMeta.releaseMarks;
  const rows = honour?.rows ?? [];

  return (
    <StudentShell>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">The class</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Honour board</h1>
      <p className="mt-2 text-muted">
        Names and marks appear here only after the teacher releases them.
      </p>

      {!open ? (
        <aside className="mt-8 flex gap-3 rounded-xl border border-warn/40 bg-bg-elevated p-5">
          <Lock className="mt-0.5 size-5 text-warn" />
          <div>
            <p className="font-medium">Marks are still with the teacher</p>
            <p className="mt-1 text-sm text-muted">
              The board stays closed until they choose “Release marks” at the desk.
            </p>
          </div>
        </aside>
      ) : rows.length === 0 ? (
        <p className="mt-8 rounded-xl border border-border bg-bg-elevated px-4 py-6 text-sm text-muted">
          No handed-in papers to rank yet.
        </p>
      ) : (
        <ol className="mt-8 space-y-2">
          {rows.map((row, i) => {
            const stage = stageById(row.stageId);
            const band = scoreBand(row.percent);
            const mine = row.name === session.name;
            return (
              <li
                key={row.paperId}
                className={`flex items-center gap-3 rounded-xl p-4 shadow-lift ${
                  mine ? "bg-accent text-accent-fg" : "bg-bg-elevated"
                }`}
              >
                <span
                  className={`grid size-10 place-items-center rounded-md font-display text-lg tabular-nums ${
                    mine ? "bg-accent-fg/15" : "bg-bg-subtle"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{row.name}</p>
                  <p className={`text-sm ${mine ? "text-accent-fg/70" : "text-muted"}`}>
                    Stage {stage?.roman} · {stage?.name}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-display text-xl tabular-nums">{row.percent}%</span>
                  <Badge variant={mine ? "outline" : band.tone}>{band.label}</Badge>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </StudentShell>
  );
}
