import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, type ReactNode } from "react";
import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/app-store";
import { STAGES, stageById } from "@/lib/bible/stages";
import { downloadTextFile } from "@/lib/bible/pack";
import { integrityLabel, scoreBand, scorePaper } from "@/lib/scoring";

export const Route = createFileRoute("/teacher/results")({ component: ResultsPage });

function ResultsPage() {
  const papers = useAppStore((s) => s.papers);
  const customQuestions = useAppStore((s) => s.customQuestions);
  const refreshPapers = useAppStore((s) => s.refreshPapers);

  useEffect(() => {
    void refreshPapers();
  }, [refreshPapers]);

  const handed = papers.filter((p) => p.submittedAt);
  const scored = handed.map((p) => ({ paper: p, score: scorePaper(p, customQuestions) }));

  const byStage = STAGES.map((stage) => {
    const rows = scored.filter((s) => s.paper.stageId === stage.id);
    const avg = rows.length
      ? Math.round(rows.reduce((n, r) => n + r.score.percent, 0) / rows.length)
      : 0;
    return { name: stage.roman, full: stage.name, avg, n: rows.length };
  });

  const bands = [
    { name: "85–100", n: scored.filter((s) => s.score.percent >= 85).length },
    { name: "70–84", n: scored.filter((s) => s.score.percent >= 70 && s.score.percent < 85).length },
    { name: "50–69", n: scored.filter((s) => s.score.percent >= 50 && s.score.percent < 70).length },
    { name: "0–49", n: scored.filter((s) => s.score.percent < 50).length },
  ];

  const classAvg = scored.length
    ? Math.round(scored.reduce((n, s) => n + s.score.percent, 0) / scored.length)
    : 0;

  const hardest = useMemo(() => {
    const tally = new Map<string, { prompt: string; wrong: number; total: number }>();
    for (const { paper } of scored) {
      for (const id of paper.questionIds) {
        const q = paper.questions?.find((item) => item.id === id);
        if (!q?.answer) continue;
        const given = paper.answers[id] ?? "";
        const row = tally.get(id) ?? { prompt: q.prompt, wrong: 0, total: 0 };
        row.total += 1;
        const mark = paper.blankMarks[id];
        const ok =
          mark === "correct"
            ? true
            : mark === "wrong"
              ? false
              : given.trim().toLowerCase() === q.answer.trim().toLowerCase() ||
                q.aliases.some((a) => a.toLowerCase() === given.trim().toLowerCase());
        if (!ok) row.wrong += 1;
        tally.set(id, row);
      }
    }
    return [...tally.values()]
      .filter((r) => r.total >= 1)
      .sort((a, b) => b.wrong / b.total - a.wrong / a.total)
      .slice(0, 8);
  }, [scored]);

  function exportCsv() {
    const header = "name,stage,submitted,correct,total,percent,tab_leaves,time_up";
    const lines = scored.map(({ paper, score }) =>
      [
        csv(paper.studentName),
        paper.stageId,
        paper.submittedAt ?? "",
        score.correct,
        score.total,
        score.percent,
        paper.tabLeaves,
        paper.timeUp ? "yes" : "no",
      ].join(","),
    );
    downloadTextFile("bible-stages-results.csv", [header, ...lines].join("\n"));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-5 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Results</h1>
          <p className="mt-2 text-muted">
            {handed.length} handed in · {papers.length - handed.length} still sitting · class
            average {classAvg}%
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={scored.length === 0}>
          <Download className="size-4" />
          Download CSV
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Handed in" value={String(handed.length)} />
        <Stat label="Class average" value={`${classAvg}%`} />
        <Stat label="In progress" value={String(papers.length - handed.length)} />
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Average by stage">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byStage}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} />
              <YAxis stroke="var(--color-muted)" fontSize={12} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                }}
                formatter={(value) => [`${value}%`, "Average"]}
              />
              <Bar dataKey="avg" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Score bands">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bands}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-muted)" fontSize={12} />
              <YAxis stroke="var(--color-muted)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="n" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="rounded-xl border border-border bg-bg-elevated p-5">
        <h2 className="font-display text-xl">Questions missed most</h2>
        {hardest.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Handed-in papers with snapshots will appear here.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {hardest.map((row, i) => (
              <li key={`${row.prompt}-${i}`} className="border-b border-border pb-3 last:border-0">
                <p className="text-sm font-medium">{row.prompt}</p>
                <p className="text-xs text-muted">
                  Missed {row.wrong} of {row.total} sittings
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-bg-elevated">
        <h2 className="px-5 pt-5 font-display text-xl">Roster</h2>
        {scored.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted">No handed-in papers yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {scored
              .sort((a, b) => b.score.percent - a.score.percent)
              .map(({ paper, score }) => {
                const stage = stageById(paper.stageId);
                const band = scoreBand(score.percent);
                const integrity = integrityLabel(paper.tabLeaves);
                return (
                  <li key={paper.id}>
                    <Link
                      to="/teacher/paper/$paperId"
                      params={{ paperId: paper.id }}
                      className="flex flex-col gap-2 px-5 py-4 hover:bg-bg sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{paper.studentName}</p>
                        <p className="text-sm text-muted">
                          Stage {stage?.roman} · {stage?.name}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={band.tone}>{band.label}</Badge>
                        <Badge variant={integrity.tone}>{integrity.label}</Badge>
                        <span className="text-sm tabular-nums">
                          {score.correct}/{score.total} · {score.percent}%
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-5">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function csv(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
