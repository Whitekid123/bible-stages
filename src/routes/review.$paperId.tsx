import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SpeakButton } from "@/components/speak-button";
import { StudentShell } from "@/components/student-shell";
import { useAppStore } from "@/lib/app-store";
import { stageById } from "@/lib/bible/stages";
import { resolveQuestion } from "@/lib/bible/pack";
import { answersMatch } from "@/lib/utils";
import { scorePaper } from "@/lib/scoring";

export const Route = createFileRoute("/review/$paperId")({ component: ReviewPage });

function ReviewPage() {
  const { paperId } = Route.useParams();
  const navigate = useNavigate();
  const session = useAppStore((s) => s.session);
  const hydrated = useAppStore((s) => s.hydrated);
  const hallMeta = useAppStore((s) => s.hallMeta);
  const pack = useAppStore((s) => s.pack);
  const rememberMisses = useAppStore((s) => s.rememberMisses);
  const paper = useAppStore((s) =>
    s.draft?.id === paperId ? s.draft : s.myPapers.find((p) => p.id === paperId),
  );

  useEffect(() => {
    if (!hydrated) return;
    if (!session) navigate({ to: "/" });
    if (session?.role === "teacher") navigate({ to: "/teacher" });
    if (!hallMeta.releaseMarks) navigate({ to: "/hall" });
  }, [hydrated, session, hallMeta.releaseMarks, navigate]);

  if (!paper) {
    return (
      <StudentShell>
        <p>That paper is not on this device.</p>
        <Button className="mt-4" asChild>
          <Link to="/hall">Back to hall</Link>
        </Button>
      </StudentShell>
    );
  }

  const stage = stageById(paper.stageId);
  const custom = pack?.questions ?? [];
  const score = scorePaper(paper, custom);
  const sitting = paper;

  function sendMisses() {
    const items = sitting.questionIds.flatMap((id) => {
      const q = resolveQuestion(id, sitting, custom);
      if (!q?.answer) return [];
      const given = sitting.answers[id] ?? "";
      if (answersMatch(given, q.answer, q.aliases)) return [];
      return [
        {
          questionId: q.id,
          stageId: sitting.stageId,
          prompt: q.prompt,
          given,
          answer: q.answer,
          reference: q.reference,
          at: new Date().toISOString(),
        },
      ];
    });
    rememberMisses(items);
    toast.success(
      items.length ? `${items.length} miss${items.length === 1 ? "" : "es"} sent to the notebook.` : "No misses to send.",
    );
  }

  return (
    <StudentShell>
      <p className="text-sm text-muted">
        Stage {stage?.roman} · {stage?.name}
      </p>
      <h1 className="mt-2 font-display text-4xl">Your paper</h1>
      <p className="mt-2 text-muted">
        {score.correct}/{score.total} · {score.percent}%
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={sendMisses}>Send misses to notebook</Button>
        <Button variant="outline" asChild>
          <Link to="/certificate/$paperId" params={{ paperId: paper.id }}>
            Certificate
          </Link>
        </Button>
      </div>
      <ol className="mt-8 space-y-4">
        {paper.questionIds.map((id, i) => {
          const q = resolveQuestion(id, paper, custom);
          if (!q) return null;
          const given = paper.answers[id] ?? "";
          const ok = q.answer ? answersMatch(given, q.answer, q.aliases) : false;
          return (
            <li key={id} className="rounded-xl bg-bg-elevated p-4 shadow-lift">
              <p className="text-xs text-muted">{i + 1}</p>
              <p className="font-medium">{q.prompt}</p>
              <p className="mt-2 text-sm">
                <span className="text-muted">You: </span>
                {given || "—"}
              </p>
              {q.answer ? (
                <p className="text-sm">
                  <span className="text-muted">Answer: </span>
                  {q.answer}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={ok ? "ok" : "danger"}>{ok ? "Correct" : "Wrong"}</Badge>
                <SpeakButton text={`${q.prompt}. ${q.answer ?? ""}`} />
              </div>
            </li>
          );
        })}
      </ol>
    </StudentShell>
  );
}
