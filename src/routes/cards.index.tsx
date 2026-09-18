import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Layers } from "lucide-react";
import { StudentShell } from "@/components/student-shell";
import { StageSeal } from "@/components/stage-seal";
import { useStudentGate } from "@/components/student-gate";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import { STAGES } from "@/lib/bible/stages";

export const Route = createFileRoute("/cards/")({ component: CardsIndex });

function CardsIndex() {
  const session = useStudentGate();
  const hallMeta = useAppStore((s) => s.hallMeta);
  const desk = useAppStore((s) => s.desk);

  if (!session) return null;

  return (
    <StudentShell wide>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">Revision</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Flashcards</h1>
      <p className="mt-3 max-w-xl text-muted">
        Flip a packed question, say the answer, then mark it known or still learning. Misses land
        in your notebook.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <span className="rounded-lg border border-border bg-bg-elevated px-4 py-3 text-sm">
          Known <span className="font-display text-xl tabular-nums">{desk.knownCount}</span>
        </span>
        <span className="rounded-lg border border-border bg-bg-elevated px-4 py-3 text-sm">
          Still learning{" "}
          <span className="font-display text-xl tabular-nums">{desk.learningCount}</span>
        </span>
      </div>
      {!hallMeta.practiceOpen ? (
        <p className="mt-6 rounded-xl border border-warn/40 bg-bg-elevated px-4 py-3 text-sm text-warn">
          The teacher has closed revision. Flashcards wait until it reopens.
        </p>
      ) : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAGES.map((stage) => (
          <div key={stage.id} className="flex flex-col rounded-xl bg-bg-elevated p-5 shadow-lift">
            <div className="flex items-start justify-between gap-3">
              <StageSeal roman={stage.roman} />
              <p className="text-sm text-muted">{stage.ages}</p>
            </div>
            <h2 className="mt-4 font-display text-2xl">{stage.name}</h2>
            <p className="mt-2 flex-1 text-sm text-muted">{stage.blurb}</p>
            {hallMeta.practiceOpen ? (
              <Button className="mt-5" asChild>
                <Link to="/cards/$stageId" params={{ stageId: stage.id }}>
                  <Layers className="size-4" />
                  Deal cards
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <Button className="mt-5" disabled>
                Closed
              </Button>
            )}
          </div>
        ))}
      </div>
    </StudentShell>
  );
}
