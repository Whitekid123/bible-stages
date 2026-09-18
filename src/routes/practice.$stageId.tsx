import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SpeakButton } from "@/components/speak-button";
import { useAppStore } from "@/lib/app-store";
import { isStageId, stageById } from "@/lib/bible/stages";
import { mergeBank } from "@/lib/bible/pack";
import { pickN, seededRng, hashString } from "@/lib/utils";
import type { Question } from "@/lib/bible/types";

export const Route = createFileRoute("/practice/$stageId")({ component: PracticePage });

function PracticePage() {
  const { stageId } = Route.useParams();
  const navigate = useNavigate();
  const session = useAppStore((s) => s.session);
  const hydrated = useAppStore((s) => s.hydrated);
  const pack = useAppStore((s) => s.pack);
  const hallMeta = useAppStore((s) => s.hallMeta);
  const markPractice = useAppStore((s) => s.markPractice);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [review, setReview] = useState<
    | { score: { correct: number; total: number; percent: number }; items: { id: string; prompt: string; given: string; answer: string; ok: boolean }[] }
    | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stage = isStageId(stageId) ? stageById(stageId) : undefined;

  const questions = useMemo(() => {
    if (!stage) return [] as Question[];
    const pool = mergeBank(pack?.questions ?? [], hallMeta.bankMode, stage.id);
    const rand = seededRng(hashString(`practice-${session?.name ?? "s"}-${stage.id}`));
    const objective = pickN(pool.filter((q) => q.section === "objective"), 8, rand);
    const blank = pickN(pool.filter((q) => q.section === "blank"), 2, rand);
    return [...objective, ...blank];
  }, [stage, pack, hallMeta.bankMode, session?.name]);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) navigate({ to: "/" });
    if (session?.role === "teacher") navigate({ to: "/teacher" });
    if (!stage) navigate({ to: "/hall" });
    if (session && !hallMeta.practiceOpen) navigate({ to: "/hall" });
  }, [hydrated, session, stage, hallMeta.practiceOpen, navigate]);

  if (!session || session.role !== "student" || !stage) return null;

  const current = questions[index];

  async function finish() {
    setBusy(true);
    setError(null);
    const res = await markPractice(
      stage!.id,
      questions.map((q) => q.id),
      answers,
    );
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.score && res.review) {
      setReview({ score: res.score, items: res.review });
    }
  }

  if (review) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-10">
        <p className="text-sm tracking-[0.16em] text-muted uppercase">Revision · Stage {stage.roman}</p>
        <h1 className="mt-2 font-display text-4xl">Done</h1>
        <p className="mt-2 text-muted">
          {review.score.correct}/{review.score.total} · {review.score.percent}%. This was not sent
          to the teacher. Misses went to your notebook.
        </p>
        <ol className="mt-8 space-y-4">
          {review.items.map((item, i) => (
            <li key={item.id} className="rounded-xl bg-bg-elevated p-4 shadow-lift">
              <p className="text-xs text-muted">{i + 1}</p>
              <p className="font-medium">{item.prompt}</p>
              <p className="mt-2 text-sm">
                <span className="text-muted">You: </span>
                {item.given || "—"}
              </p>
              <p className="text-sm">
                <span className="text-muted">Answer: </span>
                {item.answer}
              </p>
              <Badge className="mt-2" variant={item.ok ? "ok" : "danger"}>
                {item.ok ? "Correct" : "Check this"}
              </Badge>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/notebook">Open notebook</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/hall">Back to hall</Link>
          </Button>
        </div>
      </main>
    );
  }

  if (!current) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="font-display text-3xl">No packed questions for this stage</h1>
        <p className="mt-2 text-muted">Ask the teacher to add some, then refresh the pack.</p>
        <Button className="mt-6" asChild>
          <Link to="/hall">Back</Link>
        </Button>
      </main>
    );
  }

  const young = stage.id === "little" || stage.id === "growing";

  return (
    <main className="min-h-dvh">
      <header className="border-b border-border bg-bg-elevated">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">
              Revision · not an exam
            </p>
            <p className="font-display text-lg">
              {index + 1} of {questions.length}
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/hall">Leave</Link>
          </Button>
        </div>
      </header>
      <section className="mx-auto max-w-3xl px-4 py-8">
        {current.reference ? <p className="text-sm text-muted">{current.reference}</p> : null}
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className={`font-display tracking-tight ${young ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>
            {current.prompt}
          </h1>
          <SpeakButton text={current.prompt} label={young ? "Hear this" : "Read aloud"} />
        </div>
        {current.section === "objective" || (young && current.options.length > 0) ? (
          <div className="mt-6 grid gap-2">
            {current.options.map((option, i) => {
              const selected = answers[current.id] === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: option }))}
                  className={`flex min-h-12 items-center gap-3 rounded-md border px-3 py-3 text-left ${
                    selected ? "border-accent bg-accent text-accent-fg" : "border-border bg-bg-elevated"
                  }`}
                >
                  <span className="grid size-8 place-items-center rounded-sm bg-bg-subtle text-sm">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        ) : (
          <Input
            className="mt-6 h-12 text-lg"
            value={answers[current.id] ?? ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))}
            placeholder="Type your answer"
          />
        )}
        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="outline" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          {index === questions.length - 1 ? (
            <Button disabled={busy} onClick={() => void finish()}>
              {busy ? "Marking…" : "See answers"}
            </Button>
          ) : (
            <Button onClick={() => setIndex(index + 1)}>
              Next
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
