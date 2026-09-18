import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/app-store";
import { resolveQuestion } from "@/lib/bible/pack";
import { stageById } from "@/lib/bible/stages";
import { answersMatch } from "@/lib/utils";
import { integrityLabel, scorePaper } from "@/lib/scoring";
import type { Question } from "@/lib/bible/types";

export const Route = createFileRoute("/teacher/paper/$paperId")({
  component: PaperPage,
});

function PaperPage() {
  const { paperId } = Route.useParams();
  const paper = useAppStore((s) => s.papers.find((p) => p.id === paperId));
  const customQuestions = useAppStore((s) => s.customQuestions);
  const loadPaper = useAppStore((s) => s.loadPaper);
  const markBlank = useAppStore((s) => s.markBlank);
  const setTeacherNotes = useAppStore((s) => s.setTeacherNotes);

  useEffect(() => {
    if (!paper) void loadPaper(paperId);
  }, [paper, paperId, loadPaper]);

  if (!paper) {
    return (
      <main className="p-8">
        <p>Loading script from the hall…</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/teacher">Back to desk</Link>
        </Button>
      </main>
    );
  }

  const stage = stageById(paper.stageId);
  const score = scorePaper(paper, customQuestions);
  const integrity = integrityLabel(paper.tabLeaves);
  const questions = paper.questionIds
    .map((id) => resolveQuestion(id, paper, customQuestions))
    .filter((q): q is Question => Boolean(q));

  return (
    <main className="bg-bg px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" asChild className="mb-4 print:hidden">
          <Link to="/teacher">
            <ArrowLeft className="size-4" />
            Desk
          </Link>
        </Button>

        <header className="rounded-xl border border-border bg-bg-elevated p-5">
          <p className="text-sm text-muted">
            Stage {stage?.roman} · {stage?.name}
            {paper.submittedAt ? "" : " · still sitting"}
          </p>
          <h1 className="font-display text-3xl">{paper.studentName}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={integrity.tone}>{integrity.label}</Badge>
            {paper.timeUp ? <Badge variant="warn">Time ended</Badge> : null}
            <span className="text-sm tabular-nums">
              {score.correct}/{score.total} · {score.percent}%
            </span>
          </div>
          <p className="mt-2 text-sm text-muted">
            Objective {score.objectiveCorrect}/{score.objectiveTotal}
            {" · "}
            Blanks {score.blankCorrect}/{score.blankTotal}
            {score.blankMarked < score.blankTotal
              ? ` · ${score.blankTotal - score.blankMarked} still auto-marked`
              : null}
          </p>
        </header>

        <label className="mt-6 block">
          <span className="text-sm font-medium">Teacher notes</span>
          <textarea
            className="mt-1 min-h-24 w-full rounded-md border border-border bg-bg-elevated p-3 text-sm"
            value={paper.teacherNotes}
            onChange={(e) => setTeacherNotes(paper.id, e.target.value)}
          />
        </label>

        <ol className="mt-8 space-y-4">
          {questions.map((q, i) => {
            if (!q) return null;
            const given = paper.answers[q.id] ?? "";
            const autoOk = answersMatch(given, q.answer, q.aliases);
            const override = paper.blankMarks[q.id];
            const ok = q.section === "blank" && override ? override === "correct" : autoOk;
            return (
              <li key={q.id} className="rounded-lg border border-border bg-bg-elevated p-4">
                <p className="text-xs text-muted tabular-nums">
                  {i + 1} · {q.section === "objective" ? "Objective" : "Blank"}
                </p>
                <p className="mt-1 font-medium">{q.prompt}</p>
                <p className="mt-2 text-sm">
                  <span className="text-muted">Student: </span>
                  {given || "—"}
                </p>
                <p className="text-sm">
                  <span className="text-muted">Key: </span>
                  {q.answer}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={ok ? "ok" : "danger"}>{ok ? "Correct" : "Wrong"}</Badge>
                  {q.section === "blank" ? (
                    <>
                      <Button
                        size="sm"
                        variant={override === "correct" ? "default" : "outline"}
                        onClick={() => markBlank(paper.id, q.id, "correct")}
                      >
                        Mark right
                      </Button>
                      <Button
                        size="sm"
                        variant={override === "wrong" ? "danger" : "outline"}
                        onClick={() => markBlank(paper.id, q.id, "wrong")}
                      >
                        Mark wrong
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
