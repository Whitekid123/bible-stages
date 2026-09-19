import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Send, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LiveLine } from "@/components/live-line";
import { SpeakButton } from "@/components/speak-button";
import { useAppStore } from "@/lib/app-store";
import { examMinutes, examQuestionCount, isStageId, stageById } from "@/lib/bible/stages";
import { resolveQuestion } from "@/lib/bible/pack";
import { formatClock } from "@/lib/utils";
import type { Paper, Question } from "@/lib/bible/types";

export const Route = createFileRoute("/exam/$stageId")({ component: ExamPage });

function ExamPage() {
  const { stageId } = Route.useParams();
  const navigate = useNavigate();
  const session = useAppStore((s) => s.session);
  const hydrated = useAppStore((s) => s.hydrated);
  const examSize = useAppStore((s) => s.examSize);
  const draft = useAppStore((s) => s.draft);
  const sending = useAppStore((s) => s.sending);
  const startPaper = useAppStore((s) => s.startPaper);
  const saveAnswer = useAppStore((s) => s.saveAnswer);
  const flushProgress = useAppStore((s) => s.flushProgress);
  const submitPaper = useAppStore((s) => s.submitPaper);
  const [index, setIndex] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [away, setAway] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const stage = isStageId(stageId) ? stageById(stageId) : undefined;
  const paper = draft && stage && draft.stageId === stage.id && !draft.submittedAt ? draft : null;

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      navigate({ to: "/" });
      return;
    }
    if (session.role === "teacher") {
      navigate({ to: "/teacher" });
      return;
    }
    if (!stage) {
      navigate({ to: "/hall" });
    }
  }, [hydrated, session, stage, navigate]);

  useEffect(() => {
    if (draft?.submittedAt && stage && draft.stageId === stage.id) {
      navigate({ to: "/done", search: { paper: draft.id } });
    }
  }, [draft?.submittedAt, draft?.id, draft?.stageId, stage, navigate]);

  useEffect(() => {
    if (!paper || paper.submittedAt || paper.pendingSubmit) return;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        setAway(true);
      } else {
        setAway(false);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    const tick = window.setInterval(() => void flushProgress(paper.id), 5000);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(tick);
    };
  }, [paper, flushProgress]);

  if (!session || session.role !== "student" || !stage) return null;

  const sittingStage = stage;
  const sitting = examQuestionCount(sittingStage, examSize);
  const minutes = examMinutes(sitting.objective + sitting.blank, examSize);

  async function begin() {
    setBusy(true);
    setError(null);
    const result = await startPaper(sittingStage.id);
    setBusy(false);
    if (result.error) setError(result.error);
  }

  async function handIn(timeUp?: boolean) {
    if (!paper) return;
    setBusy(true);
    setSubmitError(null);
    const fail = await submitPaper(paper.id, timeUp);
    setBusy(false);
    if (fail) {
      setSubmitError(fail);
      setConfirmSubmit(false);
    }
  }

  if (!paper) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-12">
        <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">
          Stage {sittingStage.roman}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">{sittingStage.name}</h1>
        <p className="mt-2 text-muted">{sittingStage.ages}</p>
        <ul className="mt-8 space-y-3 rounded-xl bg-bg-elevated p-5 text-sm text-fg shadow-lift">
          <li className="flex gap-3">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted" />
            {sitting.objective} objective and {sitting.blank} fill-in blanks · {minutes} minutes
          </li>
          <li>Leaving this app or switching away is recorded on the teacher’s desk.</li>
          <li>Questions were packed onto this device when you entered. Answers save to the hall when connected.</li>
          <li>Handing in needs a connection. If the line drops, we keep trying until the teacher has it.</li>
        </ul>
        <div className="mt-4">
          <LiveLine />
        </div>
        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button size="lg" onClick={() => void begin()} disabled={busy}>
            {busy ? "Opening your paper…" : "Start the exam"}
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/hall">Back to hall</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <ExamSitting
      paper={paper}
      index={index}
      setIndex={setIndex}
      confirmSubmit={confirmSubmit}
      setConfirmSubmit={setConfirmSubmit}
      away={away}
      setAway={setAway}
      saveAnswer={saveAnswer}
      busy={busy || sending}
      submitError={submitError}
      onSubmit={(timeUp?: boolean) => void handIn(timeUp)}
    />
  );
}

function ExamSitting({
  paper,
  index,
  setIndex,
  confirmSubmit,
  setConfirmSubmit,
  away,
  setAway,
  saveAnswer,
  busy,
  submitError,
  onSubmit,
}: {
  paper: Paper;
  index: number;
  setIndex: (n: number) => void;
  confirmSubmit: boolean;
  setConfirmSubmit: (v: boolean) => void;
  away: boolean;
  setAway: (v: boolean) => void;
  saveAnswer: (paperId: string, questionId: string, value: string) => void;
  busy: boolean;
  submitError: string | null;
  onSubmit: (timeUp?: boolean) => void;
}) {
  const questions = useMemo(() => {
    const custom = useAppStore.getState().pack?.questions ?? [];
    const list: Question[] = [];
    for (const id of paper.questionIds) {
      const q = resolveQuestion(id, paper, custom);
      if (q) list.push(q);
    }
    return list;
  }, [paper]);
  const current = questions[index];
  const remaining = useCountdown(paper, onSubmit);
  const online = useAppStore((s) => s.online);
  const answered = questions.filter((q) => paper.answers[q.id]?.trim()).length;
  const objectiveCount = questions.filter((q) => q.section === "objective").length;
  const inBlanks = current?.section === "blank";
  const localIndex = inBlanks ? index - objectiveCount + 1 : index + 1;
  const sectionTotal = inBlanks ? questions.length - objectiveCount : objectiveCount;
  const young = paper.stageId === "little" || paper.stageId === "growing";

  if (!current) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="font-display text-3xl">This paper is missing its questions</h1>
        <p className="mt-2 text-muted">
          Return to the hall so the pack can download again, then reopen the sitting.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/hall">Back to hall</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh bg-bg">
      <header className="sticky top-0 z-20 border-b border-border bg-bg-elevated/95">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">
              {inBlanks ? "Section B · Blanks" : "Section A · Objective"}
            </p>
            <p className="font-display text-lg leading-tight">
              {localIndex} of {sectionTotal}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Time left</p>
            <p
              className={`font-display text-xl tabular-nums ${remaining <= 60 ? "text-danger" : ""}`}
            >
              {formatClock(remaining)}
            </p>
          </div>
        </div>
        <div className="h-1 bg-bg-subtle">
          <div
            className="h-full bg-accent transition-[width] duration-200"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-8">
        {current.reference ? <p className="text-sm text-muted">{current.reference}</p> : null}
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1
            className={`font-display tracking-tight text-fg ${
              young ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
            }`}
          >
            {current.prompt}
          </h1>
          <SpeakButton text={current.prompt} label={young ? "Hear this" : "Read aloud"} />
        </div>

        {current.section === "objective" || young ? (
          <div className="mt-6 grid gap-2">
            {current.options.map((option, i) => {
              const selected = paper.answers[current.id] === option;
              const letter = String.fromCharCode(65 + i);
              return (
                <button
                  key={`${current.id}-${option}`}
                  type="button"
                  onClick={() => saveAnswer(paper.id, current.id, option)}
                  disabled={paper.pendingSubmit}
                  className={`flex min-h-12 items-center gap-3 rounded-md border px-3 py-3 text-left transition-colors duration-150 ${
                    selected
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border bg-bg-elevated hover:border-border-strong"
                  } ${young ? "text-lg" : "text-base"}`}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-sm text-sm font-medium ${
                      selected ? "bg-accent-fg/15" : "bg-bg-subtle"
                    }`}
                  >
                    {letter}
                  </span>
                  {option}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <Input
              value={paper.answers[current.id] ?? ""}
              onChange={(e) => saveAnswer(paper.id, current.id, e.target.value)}
              placeholder="Type the missing word or phrase"
              className="h-12 text-lg"
              disabled={paper.pendingSubmit}
            />
            <p className="text-sm text-muted">
              Short answers. Spelling is checked; the teacher can still override.
            </p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={index === 0 || paper.pendingSubmit}
            onClick={() => setIndex(Math.max(0, index - 1))}
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
          {index === questions.length - 1 ? (
            <Button onClick={() => setConfirmSubmit(true)} disabled={paper.pendingSubmit}>
              Hand in paper
            </Button>
          ) : (
            <Button
              onClick={() => setIndex(Math.min(questions.length - 1, index + 1))}
              disabled={paper.pendingSubmit}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-1.5">
          {questions.map((q, i) => {
            const filled = Boolean(paper.answers[q.id]?.trim());
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setIndex(i)}
                className={`size-8 rounded-sm text-xs tabular-nums ${
                  i === index
                    ? "bg-accent text-accent-fg"
                    : filled
                      ? "bg-ok/15 text-ok"
                      : "bg-bg-subtle text-muted"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-muted">
          Answered {answered} of {questions.length}
          {paper.tabLeaves > 0 ? ` · Tab leaves recorded: ${paper.tabLeaves}` : null}
        </p>
        {submitError ? <p className="mt-2 text-sm text-danger">{submitError}</p> : null}
        <div className="mt-2">
          <LiveLine />
        </div>
      </section>

      {paper.pendingSubmit ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-fg/70 px-6">
          <div className="max-w-md rounded-xl border border-border bg-bg-elevated p-6 text-center">
            {online === false ? (
              <WifiOff className="mx-auto size-8 text-warn" />
            ) : (
              <Send className="mx-auto size-8 text-accent" />
            )}
            <h2 className="mt-3 font-display text-2xl">Sending to the teacher</h2>
            <p className="mt-2 text-sm text-muted">
              Your answers are held on this device until the hall confirms. We keep trying so the
              teacher actually receives the script. Stay on this page.
            </p>
            <div className="mt-4">
              <LiveLine />
            </div>
            {submitError ? <p className="mt-3 text-sm text-danger">{submitError}</p> : null}
            <Button
              className="mt-5 w-full"
              disabled={busy}
              onClick={() => onSubmit(paper.timeUp)}
            >
              {busy ? "Sending…" : "Try sending now"}
            </Button>
          </div>
        </div>
      ) : null}

      {away && !paper.pendingSubmit ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-fg/70 px-6">
          <div className="max-w-md rounded-xl border border-border bg-bg-elevated p-6 text-center">
            <AlertTriangle className="mx-auto size-8 text-warn" />
            <h2 className="mt-3 font-display text-2xl">Return to your paper</h2>
            <p className="mt-2 text-sm text-muted">
              Leaving the app is recorded on the teacher’s desk. Stay on this paper until you
              hand it in.
            </p>
            <Button className="mt-5 w-full" onClick={() => setAway(false)}>
              I am back
            </Button>
          </div>
        </div>
      ) : null}

      {confirmSubmit && !paper.pendingSubmit ? (
        <div className="fixed inset-0 z-30 grid place-items-center bg-fg/50 px-6">
          <div className="max-w-md rounded-xl border border-border bg-bg-elevated p-6">
            <h2 className="font-display text-2xl">Hand in this paper?</h2>
            <p className="mt-2 text-sm text-muted">
              You have answered {answered} of {questions.length}. This sends the script to the
              teacher. You cannot change answers after this.
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmSubmit(false)}>
                Keep working
              </Button>
              <Button className="flex-1" disabled={busy} onClick={() => onSubmit(false)}>
                {busy ? "Sending…" : "Hand in"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function useCountdown(paper: Paper, onEnd: (timeUp?: boolean) => void) {
  const endAt = useMemo(
    () => new Date(paper.startedAt).getTime() + paper.durationSec * 1000,
    [paper.startedAt, paper.durationSec],
  );
  const [now, setNow] = useState(() => Date.now());
  const ended = useRef(false);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);

  const remaining = Math.max(0, Math.floor((endAt - now) / 1000));

  useEffect(() => {
    if (remaining <= 0 && !ended.current && !paper.submittedAt && !paper.pendingSubmit) {
      ended.current = true;
      onEndRef.current(true);
    }
  }, [remaining, paper.submittedAt]);

  return remaining;
}