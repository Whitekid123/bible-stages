import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Download, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PackStatus } from "@/components/pack-status";
import { useAppStore } from "@/lib/app-store";
import { STAGES } from "@/lib/bible/stages";
import { downloadTextFile, parseQuestionImport, questionsToCsv, sittingShortage } from "@/lib/bible/pack";
import type { BankMode, Question, SectionId, StageId } from "@/lib/bible/types";

export const Route = createFileRoute("/teacher/bank")({ component: BankPage });

const emptyForm = {
  id: undefined as string | undefined,
  stageId: "little" as StageId,
  section: "objective" as SectionId,
  prompt: "",
  answer: "",
  distractors: ["", "", ""],
  aliases: "",
  reference: "",
  published: true,
};

function BankPage() {
  const customQuestions = useAppStore((s) => s.customQuestions);
  const hallMeta = useAppStore((s) => s.hallMeta);
  const examSize = useAppStore((s) => s.examSize);
  const saveQuestion = useAppStore((s) => s.saveQuestion);
  const removeQuestion = useAppStore((s) => s.removeQuestion);
  const importQuestions = useAppStore((s) => s.importQuestions);
  const addStarterSet = useAppStore((s) => s.addStarterSet);
  const saveHallOptions = useAppStore((s) => s.saveHallOptions);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<StageId | "all">("all");
  const [sectionFilter, setSectionFilter] = useState<SectionId | "all">("all");
  const [bulk, setBulk] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customQuestions.filter((item) => {
      if (stageFilter !== "all" && item.stage !== stageFilter) return false;
      if (sectionFilter !== "all" && item.section !== sectionFilter) return false;
      if (!q) return true;
      return (
        item.prompt.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        (item.reference ?? "").toLowerCase().includes(q)
      );
    });
  }, [customQuestions, query, stageFilter, sectionFilter]);

  const shortages = sittingShortage(customQuestions, hallMeta.bankMode, examSize);

  function loadQuestion(q: Question) {
    const distractors = q.options.filter((o) => o !== q.answer);
    setForm({
      id: q.id,
      stageId: q.stage,
      section: q.section,
      prompt: q.prompt,
      answer: q.answer,
      distractors: [distractors[0] ?? "", distractors[1] ?? "", distractors[2] ?? ""],
      aliases: q.aliases.join(", "),
      reference: q.reference ?? "",
      published: q.published !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const err = await saveQuestion({
      id: form.id,
      stageId: form.stageId,
      section: form.section,
      prompt: form.prompt,
      answer: form.answer,
      distractors: form.distractors,
      aliases: form.aliases
        .split(/[|,]/)
        .map((a) => a.trim())
        .filter(Boolean),
      reference: form.reference,
      published: form.published,
    });
    setBusy(false);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success(form.id ? "Question updated. Students will download it on next pack." : "Question added to the pack.");
    setForm({ ...emptyForm, stageId: form.stageId, section: form.section });
  }

  async function onImport() {
    const parsed = parseQuestionImport(bulk, { stageId: form.stageId, section: form.section });
    if (parsed.rows.length === 0) {
      toast.error(parsed.errors[0] ?? "Nothing to import.");
      return;
    }
    setBusy(true);
    const res = await importQuestions(parsed.rows);
    setBusy(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(`Imported ${res.added} question${res.added === 1 ? "" : "s"}.${parsed.errors.length ? ` ${parsed.errors.length} lines skipped.` : ""}`);
    setBulk("");
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[1.15fr_0.85fr]">
      <section>
        <h1 className="font-display text-4xl tracking-tight">Question bank</h1>
        <p className="mt-2 max-w-xl text-muted">
          Add your own questions here. Students download the whole pack when they enter the hall,
          even if they are not sitting a paper yet.
        </p>
        <div className="mt-3">
          <PackStatus />
        </div>

        <form onSubmit={(e) => void onSave(e)} className="mt-6 space-y-4 rounded-xl border border-border bg-bg-elevated p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl">{form.id ? "Edit question" : "New question"}</h2>
            {form.id ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setForm(emptyForm)}>
                Clear
              </Button>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <Label>Stage</Label>
              <select
                className="flex h-11 w-full rounded-sm border border-border bg-bg-elevated px-3 text-base"
                value={form.stageId}
                onChange={(e) => setForm({ ...form, stageId: e.target.value as StageId })}
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.roman} {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <Label>Section</Label>
              <select
                className="flex h-11 w-full rounded-sm border border-border bg-bg-elevated px-3 text-base"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value as SectionId })}
              >
                <option value="objective">Objective</option>
                <option value="blank">Fill-in blank</option>
              </select>
            </label>
          </div>
          <label className="block space-y-1.5">
            <Label htmlFor="prompt">Question</Label>
            <Textarea
              id="prompt"
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              placeholder={form.section === "blank" ? "David fought a giant named ______." : "Who made the world?"}
              required
            />
          </label>
          <label className="block space-y-1.5">
            <Label htmlFor="answer">Correct answer</Label>
            <Input
              id="answer"
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              required
            />
          </label>
          {form.section === "objective" ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {form.distractors.map((d, i) => (
                <label key={i} className="space-y-1.5">
                  <Label>Wrong option {i + 1}</Label>
                  <Input
                    value={d}
                    onChange={(e) => {
                      const next = [...form.distractors];
                      next[i] = e.target.value;
                      setForm({ ...form, distractors: next });
                    }}
                  />
                </label>
              ))}
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <Label htmlFor="aliases">Also accept (optional)</Label>
              <Input
                id="aliases"
                value={form.aliases}
                onChange={(e) => setForm({ ...form, aliases: e.target.value })}
                placeholder="Jehovah, the Lord"
              />
            </label>
            <label className="space-y-1.5">
              <Label htmlFor="reference">Reference (optional)</Label>
              <Input
                id="reference"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="Genesis 1:1"
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Include in the student pack
          </label>
          <Button type="submit" disabled={busy}>
            <Plus className="size-4" />
            {busy ? "Saving…" : form.id ? "Save changes" : "Add to bank"}
          </Button>
        </form>

        <section className="mt-8 rounded-xl border border-border bg-bg-elevated p-5">
          <h2 className="font-display text-xl">Upload a list</h2>
          <p className="mt-1 text-sm text-muted">
            CSV, tabs, or pipes. Header optional: stage, section, prompt, answer, option2, option3,
            option4, aliases, reference. One question per line.
          </p>
          <Textarea
            className="mt-3 font-mono text-sm"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder="little,objective,Who made the world?,God,a king,the wind,an angel,,Genesis 1"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={() => void onImport()} disabled={busy || !bulk.trim()}>
              <Upload className="size-4" />
              Import into bank
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                downloadTextFile(
                  "bible-stages-questions.csv",
                  questionsToCsv(customQuestions),
                )
              }
              disabled={customQuestions.length === 0}
            >
              <Download className="size-4" />
              Download CSV
            </Button>
          </div>
        </section>
      </section>

      <aside className="space-y-6">
        <section className="rounded-xl border border-border bg-bg-elevated p-5">
          <h2 className="font-display text-xl">How papers are drawn</h2>
          <p className="mt-2 text-sm text-muted">
            Mix uses your questions plus the core bank. Lecturer only uses what you uploaded.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {([
              ["mix", "Mix"],
              ["custom", "Yours"],
              ["builtin", "Core"],
            ] as [BankMode, string][]).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => void saveHallOptions({ bankMode: mode })}
                className={`h-11 rounded-sm border text-sm font-medium ${
                  hallMeta.bankMode === mode
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border bg-bg"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {shortages.length > 0 && hallMeta.bankMode === "custom" ? (
            <ul className="mt-4 space-y-1 text-sm text-warn">
              {shortages.map((row) => (
                <li key={row.stage.id}>
                  {row.stage.name} is short
                  {row.shortObjective ? ` · ${row.shortObjective} objective` : ""}
                  {row.shortBlank ? ` · ${row.shortBlank} blanks` : ""}. Papers will be shorter.
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">
              {customQuestions.length} lecturer question{customQuestions.length === 1 ? "" : "s"} in
              the hall pack.
            </p>
          )}
          <Button
            className="mt-4 w-full"
            variant="outline"
            onClick={async () => {
              setBusy(true);
              const res = await addStarterSet();
              setBusy(false);
              if (res.error) toast.error(res.error);
              else toast.success(res.added ? `Added ${res.added} starter questions.` : "Starter questions already in the bank.");
            }}
          >
            Add starter set
          </Button>
        </section>

        <section className="rounded-xl border border-border bg-bg-elevated p-5">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-xl">Your questions</h2>
            <span className="text-sm text-muted">{filtered.length}</span>
          </div>
          <Input
            className="mt-3"
            placeholder="Search prompt or answer"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <FilterChip current={stageFilter} value="all" onClick={() => setStageFilter("all")}>
              All stages
            </FilterChip>
            {STAGES.map((s) => (
              <FilterChip
                key={s.id}
                current={stageFilter}
                value={s.id}
                onClick={() => setStageFilter(s.id)}
              >
                {s.roman}
              </FilterChip>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <FilterChip current={sectionFilter} value="all" onClick={() => setSectionFilter("all")}>
              Both
            </FilterChip>
            <FilterChip
              current={sectionFilter}
              value="objective"
              onClick={() => setSectionFilter("objective")}
            >
              Objective
            </FilterChip>
            <FilterChip current={sectionFilter} value="blank" onClick={() => setSectionFilter("blank")}>
              Blanks
            </FilterChip>
          </div>
          {filtered.length === 0 ? (
            <p className="mt-6 text-sm text-muted">
              No lecturer questions yet. Add one, paste a list, or load the starter set. Students
              still receive the core bank when they enter.
            </p>
          ) : (
            <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto">
              {filtered.map((q) => {
                const stage = STAGES.find((s) => s.id === q.stage);
                return (
                  <li key={q.id} className="rounded-md border border-border bg-bg p-3">
                    <button type="button" className="w-full text-left" onClick={() => loadQuestion(q)}>
                      <p className="text-xs text-muted">
                        {stage?.roman} {stage?.name} · {q.section === "blank" ? "Blank" : "Objective"}
                        {q.published === false ? " · hidden" : ""}
                      </p>
                      <p className="mt-1 text-sm font-medium">{q.prompt}</p>
                      <p className="mt-1 text-xs text-muted">Answer: {q.answer}</p>
                    </button>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Badge variant={q.published === false ? "outline" : "ok"}>
                        {q.published === false ? "Not in pack" : "In pack"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          const err = await removeQuestion(q.id);
                          if (err) toast.error(err);
                          else {
                            toast.success("Removed from the bank.");
                            if (form.id === q.id) setForm(emptyForm);
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}

function FilterChip<T extends string>({
  current,
  value,
  onClick,
  children,
}: {
  current: T;
  value: T;
  onClick: () => void;
  children: ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded-full border px-3 text-xs font-medium ${
        active ? "border-accent bg-accent text-accent-fg" : "border-border bg-bg text-muted"
      }`}
    >
      {children}
    </button>
  );
}
