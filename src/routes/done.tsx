import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mark } from "@/components/mark";
import { useAppStore } from "@/lib/app-store";
import { stageById } from "@/lib/bible/stages";
import { integrityLabel, scorePaper } from "@/lib/scoring";

type DoneSearch = { paper?: string };

export const Route = createFileRoute("/done")({
  validateSearch: (search: Record<string, unknown>): DoneSearch => ({
    paper: typeof search.paper === "string" ? search.paper : undefined,
  }),
  component: DonePage,
});

function DonePage() {
  const navigate = useNavigate();
  const { paper: paperId } = Route.useSearch();
  const session = useAppStore((s) => s.session);
  const logout = useAppStore((s) => s.logout);
  const hallMeta = useAppStore((s) => s.hallMeta);
  const paper = useAppStore((s) =>
    s.draft?.id === paperId ? s.draft : s.papers.find((p) => p.id === paperId) ?? s.myPapers.find((p) => p.id === paperId),
  );
  const stage = paper ? stageById(paper.stageId) : undefined;
  const integrity = paper ? integrityLabel(paper.tabLeaves, paper.appLeaves) : null;
  const score =
    hallMeta.releaseMarks && paper
      ? paper.scoreCache ?? (paper.questions?.some((q) => q.answer) ? scorePaper(paper) : null)
      : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16 text-center">
      <div className="mx-auto flex justify-center">
        <Mark className="size-12" />
      </div>
      <div className="mx-auto mt-6 grid size-12 place-items-center rounded-full bg-ok/10 text-ok">
        <Check className="size-6" />
      </div>
      <h1 className="mt-6 font-display text-4xl tracking-tight">Paper received</h1>
      <p className="mt-3 text-muted">
        {session?.role === "student" ? session.name : "Student"}, your{" "}
        {stage?.name ?? "Bible"} paper has been sent to the teacher’s desk.
        {score
          ? " Marks for this sitting are below."
          : " Marks stay with the teacher — they are not shown here until released."}
      </p>
      {score ? (
        <p className="mt-4 font-display text-3xl tabular-nums">
          {score.correct}/{score.total} · {score.percent}%
        </p>
      ) : null}
      {paper?.timeUp ? (
        <p className="mt-3 text-sm text-warn">
          Time ended, so the paper was taken in as it stood.
        </p>
      ) : null}
      {integrity && paper && paper.tabLeaves > 0 ? (
        <p className="mt-2 text-sm text-warn">{integrity.label} was noted on the script.</p>
      ) : null}
      {score ? (
        <div className="mt-4 flex justify-center">
          <Badge variant="ok">Marks released</Badge>
        </div>
      ) : null}
      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {paper ? (
          <Button asChild>
            <Link to="/certificate/$paperId" params={{ paperId: paper.id }}>
              Open certificate
            </Link>
          </Button>
        ) : null}
        {score && paper ? (
          <Button variant="outline" asChild>
            <Link to="/review/$paperId" params={{ paperId: paper.id }}>
              Review answers
            </Link>
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link to="/hall">Sit another paper</Link>
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            logout();
            navigate({ to: "/" });
          }}
        >
          Sign out
        </Button>
      </div>
    </main>
  );
}
