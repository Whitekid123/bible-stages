import { createFileRoute } from "@tanstack/react-router";
import { BookmarkCheck, Trash2 } from "lucide-react";
import { StudentShell } from "@/components/student-shell";
import { SpeakButton } from "@/components/speak-button";
import { useStudentGate } from "@/components/student-gate";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import { stageById } from "@/lib/bible/stages";

export const Route = createFileRoute("/notebook")({ component: NotebookPage });

function NotebookPage() {
  const session = useStudentGate();
  const desk = useAppStore((s) => s.desk);
  const forgetMiss = useAppStore((s) => s.forgetMiss);
  const unpinQuestion = useAppStore((s) => s.unpinQuestion);
  const pinQuestion = useAppStore((s) => s.pinQuestion);

  if (!session) return null;

  return (
    <StudentShell>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">Revision</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Notebook</h1>
      <p className="mt-2 text-muted">
        Missed practice questions collect here. Bookmarks sit underneath so you can return to them.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-2xl">Still to learn</h2>
        {desk.notebook.length === 0 ? (
          <p className="mt-3 rounded-xl border border-border bg-bg-elevated px-4 py-6 text-sm text-muted">
            Nothing waiting. Sit a revision paper or mark a flashcard “still learning”.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {desk.notebook.map((item) => {
              const stage = stageById(item.stageId);
              return (
                <li key={item.questionId} className="rounded-xl bg-bg-elevated p-4 shadow-lift">
                  <p className="text-xs text-muted">
                    Stage {stage?.roman} · {stage?.name}
                    {item.reference ? ` · ${item.reference}` : ""}
                  </p>
                  <p className="mt-1 font-medium">{item.prompt}</p>
                  {item.given ? (
                    <p className="mt-2 text-sm text-muted">You wrote: {item.given}</p>
                  ) : null}
                  <p className="mt-1 text-sm">
                    <span className="text-muted">Answer: </span>
                    {item.answer}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <SpeakButton text={`${item.prompt}. ${item.answer}`} />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        pinQuestion({
                          questionId: item.questionId,
                          stageId: item.stageId,
                          prompt: item.prompt,
                          answer: item.answer,
                          reference: item.reference,
                          savedAt: new Date().toISOString(),
                        })
                      }
                    >
                      <BookmarkCheck className="size-4" />
                      Bookmark
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => forgetMiss(item.questionId)}>
                      <Trash2 className="size-4" />
                      Learned
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Bookmarks</h2>
        {desk.bookmarks.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Star a card while you flip to keep it here.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {desk.bookmarks.map((item) => {
              const stage = stageById(item.stageId);
              return (
                <li key={item.questionId} className="rounded-xl border border-border bg-bg-elevated p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted">Stage {stage?.roman}</p>
                      <p className="mt-1 font-medium">{item.prompt}</p>
                      <p className="mt-1 text-sm text-muted">{item.answer}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => unpinQuestion(item.questionId)}>
                      Remove
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
