import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { StudentShell } from "@/components/student-shell";
import { useStudentGate } from "@/components/student-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import { stageById } from "@/lib/bible/stages";
import { scorePaper } from "@/lib/scoring";

export const Route = createFileRoute("/progress")({ component: ProgressPage });

function ProgressPage() {
  const session = useStudentGate();
  const desk = useAppStore((s) => s.desk);
  const myPapers = useAppStore((s) => s.myPapers);
  const hallMeta = useAppStore((s) => s.hallMeta);
  const handed = myPapers.filter((p) => p.submittedAt);
  const avgPractice = desk.practiceLog.length
    ? Math.round(desk.practiceLog.reduce((n, r) => n + r.percent, 0) / desk.practiceLog.length)
    : null;

  if (!session) return null;

  return (
    <StudentShell wide>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">Your desk</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Progress</h1>
      <p className="mt-2 max-w-xl text-muted">
        Sittings, revision, and the streak for opening the hall on this device.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Day streak"
          value={String(desk.streak)}
          hint="Opens of the hall"
          icon
        />
        <Stat label="Papers handed in" value={String(handed.length)} hint="This class" />
        <Stat
          label="Revision average"
          value={avgPractice == null ? "—" : `${avgPractice}%`}
          hint={`${desk.practiceLog.length} practice sits`}
        />
        <Stat
          label="Notebook"
          value={String(desk.notebook.length)}
          hint={`${desk.bookmarks.length} bookmarks`}
        />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Practice log</h2>
        {desk.practiceLog.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Finish a revision paper to start this list.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl bg-bg-elevated shadow-lift">
            {desk.practiceLog.map((row) => {
              const stage = stageById(row.stageId);
              return (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="font-medium">
                      Stage {stage?.roman} · {stage?.name}
                    </p>
                    <p className="text-sm text-muted">{new Date(row.at).toLocaleString()}</p>
                  </div>
                  <Badge variant={row.percent >= 70 ? "ok" : "warn"}>
                    {row.correct}/{row.total} · {row.percent}%
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Exam papers</h2>
        {handed.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No sittings handed in yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl bg-bg-elevated shadow-lift">
            {handed.map((paper) => {
              const stage = stageById(paper.stageId);
              const score =
                hallMeta.releaseMarks && paper.questions?.some((q) => q.answer)
                  ? scorePaper(paper)
                  : paper.scoreCache;
              return (
                <li key={paper.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="font-medium">
                      Stage {stage?.roman} · {stage?.name}
                    </p>
                    <p className="text-sm text-muted">
                      {new Date(paper.submittedAt ?? paper.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {score ? (
                      <Badge variant="ok">
                        {score.correct}/{score.total} · {score.percent}%
                      </Badge>
                    ) : (
                      <Badge>Handed in</Badge>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/certificate/$paperId" params={{ paperId: paper.id }}>
                        Certificate
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </StudentShell>
  );
}

function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon?: boolean;
}) {
  return (
    <div className="rounded-xl bg-bg-elevated p-5 shadow-lift">
      <p className="flex items-center gap-2 text-sm text-muted">
        {icon ? <Flame className="size-4 text-warn" /> : null}
        {label}
      </p>
      <p className="mt-2 font-display text-4xl tabular-nums leading-none">{value}</p>
      <p className="mt-2 text-xs text-subtle">{hint}</p>
    </div>
  );
}
