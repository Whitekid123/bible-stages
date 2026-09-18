import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, RotateCcw } from "lucide-react";
import { StudentShell } from "@/components/student-shell";
import { SpeakButton } from "@/components/speak-button";
import { useStudentGate } from "@/components/student-gate";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import { isStageId, stageById } from "@/lib/bible/stages";
import type { RevisionCard } from "@/lib/bible/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cards/$stageId")({ component: CardsPage });

function CardsPage() {
  const { stageId } = Route.useParams();
  const session = useStudentGate();
  const stage = isStageId(stageId) ? stageById(stageId) : undefined;
  const fetchCards = useAppStore((s) => s.fetchCards);
  const bumpCard = useAppStore((s) => s.bumpCard);
  const rememberMisses = useAppStore((s) => s.rememberMisses);
  const pinQuestion = useAppStore((s) => s.pinQuestion);
  const unpinQuestion = useAppStore((s) => s.unpinQuestion);
  const bookmarks = useAppStore((s) => s.desk.bookmarks);
  const [cards, setCards] = useState<RevisionCard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!session || !stage) return;
    let live = true;
    setBusy(true);
    void fetchCards(stage.id, 12).then((res) => {
      if (!live) return;
      setBusy(false);
      if (res.error) setError(res.error);
      else {
        setCards(res.cards ?? []);
        setIndex(0);
        setFlipped(false);
      }
    });
    return () => {
      live = false;
    };
  }, [session, stage, fetchCards]);

  if (!session || !stage) return null;

  const current = cards[index];
  const pinned = current ? bookmarks.some((b) => b.questionId === current.id) : false;

  function next() {
    setFlipped(false);
    setIndex((i) => Math.min(i + 1, cards.length));
  }

  function mark(kind: "known" | "learning") {
    if (!current) return;
    bumpCard(kind);
    if (kind === "learning") {
      rememberMisses([
        {
          questionId: current.id,
          stageId: current.stage,
          prompt: current.prompt,
          given: "",
          answer: current.answer,
          reference: current.reference,
          at: new Date().toISOString(),
        },
      ]);
    }
    next();
  }

  return (
    <StudentShell>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">
        Flashcards · Stage {stage.roman}
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{stage.name}</h1>
      <p className="mt-2 text-muted">
        {busy
          ? "Dealing from the packed bank…"
          : current
            ? `${index + 1} of ${cards.length}`
            : cards.length
              ? "Deck complete"
              : "No cards in this stage"}
      </p>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      {current ? (
        <div className="mt-8">
          <button
              type="button"
              onClick={() => setFlipped((v) => !v)}
              className={cn("w-full min-h-64 rounded-xl p-6 text-left shadow-lift", flipped ? "bg-accent text-accent-fg" : "bg-bg-elevated")}
            >
              {flipped ? (
                <>
                  <p className="text-xs font-medium tracking-[0.16em] uppercase text-accent-fg/70">
                    Answer
                  </p>
                  <p className="mt-3 font-display text-2xl leading-snug">{current.answer}</p>
                  <p className="mt-8 text-sm text-accent-fg/70">Tap to hide</p>
                </>
              ) : (
                <>
                  {current.reference ? (
                    <p className="text-sm text-muted">{current.reference}</p>
                  ) : null}
                  <p className="mt-3 font-display text-2xl leading-snug">{current.prompt}</p>
                  <p className="mt-8 text-sm text-muted">Tap to show the answer</p>
                </>
              )}
            </button>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <SpeakButton text={`${current.prompt}. ${flipped ? current.answer : ""}`} />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                pinned
                  ? unpinQuestion(current.id)
                  : pinQuestion({
                      questionId: current.id,
                      stageId: current.stage,
                      prompt: current.prompt,
                      answer: current.answer,
                      reference: current.reference,
                      savedAt: new Date().toISOString(),
                    })
              }
            >
              {pinned ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
              {pinned ? "Saved" : "Bookmark"}
            </Button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => mark("learning")}>
              Still learning
            </Button>
            <Button onClick={() => mark("known")}>I know this</Button>
          </div>
        </div>
      ) : !busy && cards.length > 0 ? (
        <div className="mt-10 rounded-xl bg-bg-elevated p-6 shadow-lift">
          <h2 className="font-display text-2xl">Deck finished</h2>
          <p className="mt-2 text-muted">
            Anything you marked “still learning” is in the notebook.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setIndex(0);
                setFlipped(false);
              }}
            >
              <RotateCcw className="size-4" />
              Run the deck again
            </Button>
            <Button variant="outline" asChild>
              <Link to="/notebook">Open notebook</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <Button variant="ghost" className="mt-8" asChild>
        <Link to="/cards">All stages</Link>
      </Button>
    </StudentShell>
  );
}
