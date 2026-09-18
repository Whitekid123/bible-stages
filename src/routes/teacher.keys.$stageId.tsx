import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import { mergeBank } from "@/lib/bible/pack";
import { isStageId, stageById } from "@/lib/bible/stages";

export const Route = createFileRoute("/teacher/keys/$stageId")({
  component: KeysPage,
});

function KeysPage() {
  const { stageId } = Route.useParams();
  const customQuestions = useAppStore((s) => s.customQuestions);
  const [showAnswers, setShowAnswers] = useState(true);
  const stage = isStageId(stageId) ? stageById(stageId) : undefined;
  if (!stage) {
    return (
      <main className="p-8">
        <p>Unknown stage.</p>
        <Link to="/teacher" className="text-accent underline">
          Back
        </Link>
      </main>
    );
  }

  const pool = mergeBank(customQuestions, "mix", stage.id);
  const objective = pool.filter((q) => q.section === "objective");
  const blanks = pool.filter((q) => q.section === "blank");
  const lecturerCount = pool.filter((q) => q.source === "lecturer" || q.id.startsWith("c-")).length;

  return (
    <main className="bg-bg px-4 py-8 print:px-0 print:py-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button variant="ghost" asChild>
            <Link to="/teacher">
              <ArrowLeft className="size-4" />
              Desk
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowAnswers((v) => !v)}>
              {showAnswers ? "Hide answers" : "Show answers"}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print
            </Button>
          </div>
        </div>

        <header className="border-b border-border pb-4">
          <p className="text-sm tracking-[0.16em] text-muted uppercase">
            Teacher only · {showAnswers ? "Answer key" : "Question paper"}
          </p>
          <h1 className="mt-1 font-display text-4xl">
            Stage {stage.roman} · {stage.name}
          </h1>
          <p className="mt-1 text-muted">
            {stage.ages}
            {lecturerCount ? ` · ${lecturerCount} lecturer questions mixed in` : ""}
          </p>
        </header>

        <section className="mt-8">
          <h2 className="font-display text-2xl">Section A · Objective</h2>
          <ol className="mt-4 space-y-4">
            {objective.map((q, i) => (
              <li key={q.id} className="border-b border-border pb-3">
                <p className="text-sm text-muted tabular-nums">{i + 1}.</p>
                <p className="font-medium">{q.prompt}</p>
                {!showAnswers && q.options.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {q.options.map((opt, oi) => (
                      <li key={opt}>
                        {String.fromCharCode(65 + oi)}. {opt}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {showAnswers ? (
                  <p className="mt-1 text-sm">
                    <span className="text-muted">Answer: </span>
                    {q.answer}
                    {q.source === "lecturer" || q.id.startsWith("c-") ? (
                      <span className="text-subtle"> · lecturer</span>
                    ) : null}
                  </p>
                ) : null}
                {showAnswers && q.reference ? <p className="text-xs text-subtle">{q.reference}</p> : null}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl">Section B · Blanks</h2>
          <ol className="mt-4 space-y-4">
            {blanks.map((q, i) => (
              <li key={q.id} className="border-b border-border pb-3">
                <p className="text-sm text-muted tabular-nums">{i + 1}.</p>
                <p className="font-medium">{q.prompt}</p>
                {showAnswers ? (
                  <p className="mt-1 text-sm">
                    <span className="text-muted">Answer: </span>
                    {q.answer}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
