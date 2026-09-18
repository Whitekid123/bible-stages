import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { StudentShell } from "@/components/student-shell";
import { Mark } from "@/components/mark";
import { useStudentGate } from "@/components/student-gate";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import { stageById } from "@/lib/bible/stages";
import { scorePaper } from "@/lib/scoring";

export const Route = createFileRoute("/certificate/$paperId")({ component: CertificatePage });

function CertificatePage() {
  const { paperId } = Route.useParams();
  const session = useStudentGate();
  const hallMeta = useAppStore((s) => s.hallMeta);
  const paper = useAppStore((s) =>
    s.draft?.id === paperId
      ? s.draft
      : s.myPapers.find((p) => p.id === paperId) ?? s.papers.find((p) => p.id === paperId),
  );
  const stage = paper ? stageById(paper.stageId) : undefined;
  const score =
    hallMeta.releaseMarks && paper
      ? paper.scoreCache ?? (paper.questions?.some((q) => q.answer) ? scorePaper(paper) : null)
      : null;

  if (!session) return null;

  if (!paper) {
    return (
      <StudentShell>
        <h1 className="font-display text-3xl">That paper is not on this device</h1>
        <Button className="mt-6" asChild>
          <Link to="/hall">Back to hall</Link>
        </Button>
      </StudentShell>
    );
  }

  return (
    <StudentShell>
      <div className="print-hidden mb-6 flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link to="/hall">Back to hall</Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="size-4" />
          Print certificate
        </Button>
      </div>
      <article className="cert-frame cert-print rounded-xl bg-bg-elevated px-6 py-10 text-center sm:px-12">
        <div className="mx-auto flex justify-center">
          <Mark className="size-12" />
        </div>
        <p className="mt-6 text-xs font-medium tracking-[0.22em] text-muted uppercase">
          Bible Stages · Classroom hall
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">Certificate</h1>
        <p className="mt-6 text-muted">This is to record that</p>
        <p className="mt-2 font-display text-3xl">{paper.studentName}</p>
        <p className="mt-6 text-muted">sat Stage {stage?.roman} · {stage?.name}</p>
        <p className="mt-2 text-sm text-subtle">{stage?.ages}</p>
        {score ? (
          <p className="mt-6 font-display text-3xl tabular-nums">
            {score.correct}/{score.total} · {score.percent}%
          </p>
        ) : (
          <p className="mt-6 text-sm text-muted">Marks remain with the teacher until released.</p>
        )}
        <div className="rule-ornament mx-auto mt-8 max-w-xs" />
        <p className="mt-6 text-sm text-muted">
          {paper.submittedAt
            ? new Date(paper.submittedAt).toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "In progress"}
        </p>
      </article>
    </StudentShell>
  );
}
