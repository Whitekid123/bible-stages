import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookMarked, KeyRound, Printer, RefreshCw, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { LiveLine } from "@/components/live-line";
import { PackStatus } from "@/components/pack-status";
import { InstallApp } from "@/components/install-app";
import { useAppStore } from "@/lib/app-store";
import { STAGES, stageById } from "@/lib/bible/stages";
import { mergeBank } from "@/lib/bible/pack";
import { integrityLabel, scorePaper } from "@/lib/scoring";
import type { ExamSize } from "@/lib/bible/types";

export const Route = createFileRoute("/teacher/")({ component: TeacherDesk });

function TeacherDesk() {
  const papers = useAppStore((s) => s.papers);
  const examSize = useAppStore((s) => s.examSize);
  const hallMeta = useAppStore((s) => s.hallMeta);
  const customQuestions = useAppStore((s) => s.customQuestions);
  const refreshPapers = useAppStore((s) => s.refreshPapers);
  const setExamSize = useAppStore((s) => s.setExamSize);
  const savePasswords = useAppStore((s) => s.savePasswords);
  const saveHallOptions = useAppStore((s) => s.saveHallOptions);
  const [classPassword, setClassPassword] = useState("class");
  const [teacherPassword, setTeacherPassword] = useState("teacher");
  const [notice, setNotice] = useState(hallMeta.notice);
  const [saved, setSaved] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setNotice(hallMeta.notice);
  }, [hallMeta.notice]);

  useEffect(() => {
    void refreshPapers();
    const t = window.setInterval(() => void refreshPapers(), 8000);
    return () => window.clearInterval(t);
  }, [refreshPapers]);

  const handedIn = useMemo(
    () =>
      papers
        .filter((p) => p.submittedAt)
        .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "")),
    [papers],
  );
  const inProgress = useMemo(() => papers.filter((p) => !p.submittedAt), [papers]);

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl tracking-tight">Scripts</h1>
            <p className="mt-2 text-muted">
              Papers arrive here when a student starts and when they hand in — from this device
              or another. In-progress answers refresh as they save.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={refreshing}
            onClick={async () => {
              setRefreshing(true);
              await refreshPapers();
              setRefreshing(false);
            }}
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-bg-elevated p-4 shadow-lift">
            <p className="text-xs font-medium tracking-[0.12em] text-muted uppercase">Sitting now</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{inProgress.length}</p>
          </div>
          <div className="rounded-xl bg-bg-elevated p-4 shadow-lift">
            <p className="text-xs font-medium tracking-[0.12em] text-muted uppercase">Handed in</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{handedIn.length}</p>
          </div>
          <div className="rounded-xl bg-bg-elevated p-4 shadow-lift">
            <p className="text-xs font-medium tracking-[0.12em] text-muted uppercase">Hall</p>
            <p className="mt-1 font-display text-xl">
              {hallMeta.sittingOpen ? "Open" : "Closed"}
            </p>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <LiveLine />
          <PackStatus compact />
        </div>

        {inProgress.length > 0 ? (
          <div className="mt-6">
            <h2 className="text-sm font-medium tracking-[0.14em] text-muted uppercase">
              Sitting now
            </h2>
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-bg-elevated">
              <ul className="divide-y divide-border">
                {inProgress.map((paper) => {
                  const stage = stageById(paper.stageId);
                  const savedCount = Object.values(paper.answers).filter((v) => v?.trim()).length;
                  return (
                    <li key={paper.id}>
                      <Link
                        to="/teacher/paper/$paperId"
                        params={{ paperId: paper.id }}
                        className="block px-5 py-3 transition-colors duration-150 hover:bg-bg"
                      >
                        <p className="font-medium">{paper.studentName}</p>
                        <p className="text-sm text-muted">
                          Stage {stage?.roman} · {stage?.name} · {savedCount}/
                          {paper.questionIds.length} answers saved to the hall
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-bg-elevated">
          {handedIn.length === 0 ? (
            <p className="px-5 py-10 text-sm text-muted">
              No papers handed in yet. When a student submits online, the script appears here.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {handedIn.map((paper) => {
                const stage = stageById(paper.stageId);
                const score = scorePaper(paper, customQuestions);
                const integrity = integrityLabel(paper.tabLeaves);
                return (
                  <li key={paper.id}>
                    <Link
                      to="/teacher/paper/$paperId"
                      params={{ paperId: paper.id }}
                      className="flex flex-col gap-1 px-5 py-4 transition-colors duration-150 hover:bg-bg sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{paper.studentName}</p>
                        <p className="text-sm text-muted">
                          Stage {stage?.roman} · {stage?.name}
                          {paper.timeUp ? " · time ended" : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={integrity.tone}>{integrity.label}</Badge>
                        <span className="text-sm tabular-nums text-fg">
                          {score.correct}/{score.total} · {score.percent}%
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <aside className="space-y-6">
        <InstallApp compact />
        <section className="rounded-xl border border-border bg-bg-elevated p-5">
          <div className="flex items-center gap-2">
            <BookMarked className="size-4 text-muted" />
            <h2 className="font-display text-xl">Lecturer questions</h2>
          </div>
          <p className="mt-2 text-sm text-muted">
            {customQuestions.length} uploaded. Students download them automatically when they
            enter.
          </p>
          <Button className="mt-4 w-full" asChild>
            <Link to="/teacher/bank">Open the question bank</Link>
          </Button>
        </section>

        <section className="rounded-xl border border-border bg-bg-elevated p-5">
          <h2 className="font-display text-xl">Hall board</h2>
          <p className="mt-2 text-sm text-muted">A short note every student sees in the hall.</p>
          <Textarea
            className="mt-3"
            value={notice}
            onChange={(e) => setNotice(e.target.value)}
            placeholder="Sit Stage III after break. Bags at the door."
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              variant={hallMeta.sittingOpen ? "default" : "outline"}
              onClick={() => void saveHallOptions({ sittingOpen: !hallMeta.sittingOpen })}
            >
              {hallMeta.sittingOpen ? "Close sittings" : "Open sittings"}
            </Button>
            <Button
              variant={hallMeta.releaseMarks ? "default" : "outline"}
              onClick={() => void saveHallOptions({ releaseMarks: !hallMeta.releaseMarks })}
            >
              {hallMeta.releaseMarks ? "Hide marks" : "Release marks"}
            </Button>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hallMeta.practiceOpen}
              onChange={(e) => void saveHallOptions({ practiceOpen: e.target.checked })}
            />
            Allow revision from the packed questions
          </label>
          <Button
            className="mt-3 w-full"
            variant="outline"
            onClick={async () => {
              const err = await saveHallOptions({ notice });
              if (err) toast.error(err);
              else toast.success("Notice posted to the hall.");
            }}
          >
            Post notice
          </Button>
        </section>

        <section className="rounded-xl border border-border bg-bg-elevated p-5">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted" />
            <h2 className="font-display text-xl">Answer keys</h2>
          </div>
          <p className="mt-2 text-sm text-muted">
            Full bank for each stage, including your uploads. Students never see this.
          </p>
          <ul className="mt-4 space-y-2">
            {STAGES.map((stage) => {
              const pool = mergeBank(customQuestions, "mix", stage.id);
              return (
                <li key={stage.id}>
                  <Link
                    to="/teacher/keys/$stageId"
                    params={{ stageId: stage.id }}
                    className="flex items-center justify-between rounded-md border border-border bg-bg px-3 py-2.5 text-sm hover:border-border-strong"
                  >
                    <span>
                      {stage.roman} {stage.name}
                    </span>
                    <span className="text-muted">
                      {pool.filter((q) => q.section === "objective").length} +{" "}
                      {pool.filter((q) => q.section === "blank").length}
                      <Printer className="ml-2 inline size-3.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-bg-elevated p-5">
          <div className="flex items-center gap-2">
            <Settings2 className="size-4 text-muted" />
            <h2 className="font-display text-xl">Class sitting</h2>
          </div>
          <p className="mt-2 text-sm text-muted">
            How many questions students face today. Applies to the whole hall.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {([20, 40, "full"] as ExamSize[]).map((size) => (
              <button
                key={String(size)}
                type="button"
                onClick={() => void setExamSize(size)}
                className={`h-11 rounded-sm border text-sm font-medium ${
                  examSize === size
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border bg-bg"
                }`}
              >
                {size === "full" ? "Full paper" : `${size} Q`}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-bg-elevated p-5">
          <h2 className="font-display text-xl">Hall passwords</h2>
          <p className="mt-2 text-sm text-muted">Saved for the whole class, not only this device.</p>
          <form
            className="mt-4 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const err = await savePasswords(classPassword, teacherPassword);
              setSaved(err ?? "Saved");
              window.setTimeout(() => setSaved(null), 1800);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="class-pass">Class password</Label>
              <Input
                id="class-pass"
                value={classPassword}
                onChange={(e) => setClassPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="teach-pass">Teacher password</Label>
              <Input
                id="teach-pass"
                value={teacherPassword}
                onChange={(e) => setTeacherPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              {saved ?? "Save passwords"}
            </Button>
          </form>
        </section>
      </aside>
    </div>
  );
}
