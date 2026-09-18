import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, BookOpen, Layers, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveLine } from "@/components/live-line";
import { PackStatus } from "@/components/pack-status";
import { StudentShell } from "@/components/student-shell";
import { StageSeal } from "@/components/stage-seal";
import { VerseRibbon } from "@/components/verse-ribbon";
import { InstallApp } from "@/components/install-app";
import { useStudentGate } from "@/components/student-gate";
import { useAppStore } from "@/lib/app-store";
import { STAGES, examMinutes, examQuestionCount } from "@/lib/bible/stages";
import { mergeBank } from "@/lib/bible/pack";
import { scorePaper } from "@/lib/scoring";

export const Route = createFileRoute("/hall")({ component: HallPage });

function HallPage() {
  const session = useStudentGate();
  const examSize = useAppStore((s) => s.examSize);
  const draft = useAppStore((s) => s.draft);
  const pack = useAppStore((s) => s.pack);
  const hallMeta = useAppStore((s) => s.hallMeta);
  const myPapers = useAppStore((s) => s.myPapers);
  const desk = useAppStore((s) => s.desk);
  const syncPack = useAppStore((s) => s.syncPack);
  const refreshMyPapers = useAppStore((s) => s.refreshMyPapers);
  const touchStreak = useAppStore((s) => s.touchStreak);

  useEffect(() => {
    if (!session) return;
    touchStreak();
    void syncPack();
    void refreshMyPapers();
    const t = window.setInterval(() => {
      void syncPack();
      void refreshMyPapers();
    }, 20000);
    return () => window.clearInterval(t);
  }, [session, syncPack, refreshMyPapers, touchStreak]);

  if (!session) return null;

  const handed = myPapers.filter((p) => p.submittedAt);
  const custom = pack?.questions ?? [];

  return (
    <StudentShell wide>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">
            Choose a paper
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">The hall</h1>
          <p className="mt-3 max-w-xl text-muted">
            Sit the general paper, or the stage that matches your age. Questions are already packed
            onto this device.
          </p>
        </div>
        <LiveLine />
      </div>

      <div className="mt-8">
        <VerseRibbon />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Day streak" value={String(desk.streak || 1)} />
        <MiniStat label="Papers in" value={String(handed.length)} />
        <MiniStat label="To revise" value={String(desk.notebook.length)} />
        <MiniStat
          label="Sittings"
          value={hallMeta.sittingOpen ? "Open" : "Closed"}
        />
      </div>

      <div className="mt-4">
        <PackStatus />
      </div>

      <div className="mt-4">
        <InstallApp compact />
      </div>

      {hallMeta.notice ? (
        <aside className="mt-6 rounded-xl border border-accent/25 bg-bg-elevated p-4 shadow-lift">
          <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">
            From the teacher
          </p>
          <p className="mt-1 text-fg">{hallMeta.notice}</p>
        </aside>
      ) : null}

      {!hallMeta.sittingOpen ? (
        <aside className="mt-6 flex gap-3 rounded-xl border border-warn/40 bg-bg-elevated p-4">
          <Lock className="mt-0.5 size-5 text-warn" />
          <div>
            <p className="font-medium">Sittings are closed</p>
            <p className="mt-1 text-sm text-muted">
              You still have the question pack. Revision stays available if the teacher left it
              open.
            </p>
          </div>
        </aside>
      ) : null}

      {draft && !draft.submittedAt && draft.pendingSubmit ? (
        <div className="mt-6 rounded-xl border border-warn/40 bg-bg-elevated p-4">
          <p className="font-medium">A paper is still being sent</p>
          <p className="mt-1 text-sm text-muted">
            Stay with it until the teacher’s desk confirms. Do not start another sitting yet.
          </p>
          <Button className="mt-3" asChild>
            <Link to="/exam/$stageId" params={{ stageId: draft.stageId }}>
              Return to sending
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {STAGES.map((stage) => {
          const pool = mergeBank(custom, hallMeta.bankMode, stage.id);
          const bankObj = pool.filter((q) => q.section === "objective").length;
          const bankBlank = pool.filter((q) => q.section === "blank").length;
          const sitting = examQuestionCount(stage, examSize);
          const minutes = examMinutes(
            Math.min(sitting.objective, bankObj) + Math.min(sitting.blank, bankBlank),
            examSize,
          );
          const lecturer = custom.filter((q) => q.stage === stage.id).length;
          return (
            <article key={stage.id} className="flex flex-col rounded-xl bg-bg-elevated p-5 shadow-lift">
              <div className="flex items-start justify-between gap-3">
                <StageSeal roman={stage.roman} />
                <span className="text-sm text-muted">{stage.ages}</span>
              </div>
              <h2 className="mt-4 font-display text-2xl">{stage.name}</h2>
              <p className="mt-2 flex-1 text-sm text-muted">{stage.blurb}</p>
              <p className="mt-4 text-sm text-fg">
                Today: {Math.min(sitting.objective, bankObj)} objective +{" "}
                {Math.min(sitting.blank, bankBlank)} blanks · {minutes} min
              </p>
              <p className="text-xs text-subtle">
                Packed here: {bankObj} objective, {bankBlank} blanks
                {lecturer ? ` · ${lecturer} from the lecturer` : ""}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {hallMeta.sittingOpen ? (
                  <Button asChild>
                    <Link to="/exam/$stageId" params={{ stageId: stage.id }}>
                      Begin
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button disabled>
                    <Lock className="size-4" />
                    Closed
                  </Button>
                )}
                {hallMeta.practiceOpen ? (
                  <Button variant="outline" asChild>
                    <Link to="/practice/$stageId" params={{ stageId: stage.id }}>
                      <BookOpen className="size-4" />
                      Revision
                    </Link>
                  </Button>
                ) : null}
                {hallMeta.practiceOpen ? (
                  <Button variant="outline" asChild>
                    <Link to="/cards/$stageId" params={{ stageId: stage.id }}>
                      <Layers className="size-4" />
                      Cards
                    </Link>
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {handed.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl">Your papers</h2>
          <p className="mt-1 text-sm text-muted">
            {hallMeta.releaseMarks
              ? "The teacher has released marks for this class."
              : "Marks stay with the teacher until they are released."}
          </p>
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl bg-bg-elevated shadow-lift">
            {handed.map((paper) => {
              const stage = STAGES.find((s) => s.id === paper.stageId);
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
                    {hallMeta.releaseMarks ? (
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/review/$paperId" params={{ paperId: paper.id }}>
                          Review
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </StudentShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bg-elevated px-4 py-3 shadow-lift">
      <p className="text-xs font-medium tracking-[0.12em] text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums leading-none">{value}</p>
    </div>
  );
}
