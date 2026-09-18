import { QUESTIONS, questionById } from "./bank";
import { STAGES, examQuestionCount } from "./stages";
import type {
  BankMode,
  ExamSize,
  HallMeta,
  Paper,
  Question,
  SectionId,
  StageId,
} from "./types";

export const DEFAULT_META: HallMeta = {
  examSize: 20,
  notice: "",
  sittingOpen: true,
  bankMode: "mix",
  packVersion: 1,
  practiceOpen: true,
  releaseMarks: false,
};

export function parseBankMode(value: string | undefined | null): BankMode {
  if (value === "custom" || value === "builtin") return value;
  return "mix";
}

export function stripAnswer(question: Question): Question {
  return { ...question, answer: "", aliases: [] };
}

export function mergeBank(
  custom: Question[],
  mode: BankMode = "mix",
  stageId?: StageId,
  section?: SectionId,
): Question[] {
  const extras = custom.filter((q) => q.published !== false);
  const builtin = QUESTIONS.map((q) => ({ ...q, source: "builtin" as const }));
  const pool =
    mode === "custom" ? extras : mode === "builtin" ? builtin : [...extras, ...builtin];
  const seen = new Set<string>();
  const out: Question[] = [];
  for (const q of pool) {
    if (stageId && q.stage !== stageId) continue;
    if (section && q.section !== section) continue;
    if (seen.has(q.id)) continue;
    seen.add(q.id);
    out.push(q);
  }
  return out;
}

export function resolveQuestion(
  id: string,
  paper?: Paper | null,
  custom: Question[] = [],
): Question | undefined {
  return (
    paper?.questions?.find((q) => q.id === id) ??
    custom.find((q) => q.id === id) ??
    questionById(id)
  );
}

export function countBank(questions: Question[]) {
  const stats = {} as Record<StageId, { objective: number; blank: number }>;
  for (const stage of STAGES) stats[stage.id] = { objective: 0, blank: 0 };
  for (const q of questions) {
    stats[q.stage] ??= { objective: 0, blank: 0 };
    stats[q.stage][q.section] += 1;
  }
  return stats;
}

export function sittingShortage(
  questions: Question[],
  mode: BankMode,
  size: ExamSize,
) {
  return STAGES.map((stage) => {
    const need = examQuestionCount(stage, size);
    const have = countBank(mergeBank(questions, mode, stage.id))[stage.id] ?? {
      objective: 0,
      blank: 0,
    };
    return {
      stage,
      need,
      have,
      shortObjective: Math.max(0, need.objective - have.objective),
      shortBlank: Math.max(0, need.blank - have.blank),
    };
  }).filter((row) => row.shortObjective > 0 || row.shortBlank > 0);
}

export type ParsedImport = {
  stageId: StageId;
  section: SectionId;
  prompt: string;
  answer: string;
  distractors: string[];
  aliases: string[];
  reference: string;
};

const STAGE_IDS: StageId[] = ["general", "little", "growing", "juniors", "youth"];

function isStageId(value: string): value is StageId {
  return STAGE_IDS.includes(value as StageId);
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function splitFlexible(line: string): string[] {
  if (line.includes("\t")) return line.split("\t").map((p) => p.trim());
  if (line.includes("|")) return line.split("|").map((p) => p.trim());
  return splitCsvLine(line);
}

function parseAliases(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split(/[|;,/]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function parseQuestionImport(
  raw: string,
  fallback: { stageId: StageId; section: SectionId },
): { rows: ParsedImport[]; errors: string[] } {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  const errors: string[] = [];
  const rows: ParsedImport[] = [];
  if (lines.length === 0) return { rows, errors: ["Nothing to import."] };

  let start = 0;
  let header: string[] | null = null;
  const first = splitFlexible(lines[0]).map((h) => h.toLowerCase());
  if (first.includes("prompt") && first.includes("answer")) {
    header = first;
    start = 1;
  }

  for (let i = start; i < lines.length; i++) {
    const parts = splitFlexible(lines[i]);
    const lineNo = i + 1;
    const get = (name: string, index: number) => {
      if (!header) return parts[index] ?? "";
      const at = header.indexOf(name);
      return at >= 0 ? (parts[at] ?? "") : "";
    };

    const stageRaw = (get("stage", 0) || get("stage_id", 0) || fallback.stageId).toLowerCase();
    const sectionRaw = (get("section", 1) || fallback.section).toLowerCase();
    const prompt = header ? get("prompt", 2) : parts.length >= 2 ? parts[0] : "";
    const answer = header ? get("answer", 3) : parts[1] ?? "";
    const distractors = header
      ? [get("option2", 4) || get("distractor1", 4), get("option3", 5) || get("distractor2", 5), get("option4", 6) || get("distractor3", 6)]
      : parts.slice(2, 5);
    const aliases = parseAliases(header ? get("aliases", 7) : parts[5]);
    const reference = header ? get("reference", 8) : parts[6] ?? "";

    const stageId = isStageId(stageRaw) ? stageRaw : fallback.stageId;
    const section: SectionId = sectionRaw === "blank" ? "blank" : "objective";
    if (!prompt || prompt.length < 4) {
      errors.push(`Line ${lineNo}: prompt is too short.`);
      continue;
    }
    if (!answer) {
      errors.push(`Line ${lineNo}: missing answer.`);
      continue;
    }
    const cleanDistractors = distractors.map((d) => d.trim()).filter(Boolean).slice(0, 3);
    if (section === "objective" && cleanDistractors.length < 1) {
      errors.push(`Line ${lineNo}: objective questions need at least one wrong option.`);
      continue;
    }
    rows.push({
      stageId,
      section,
      prompt: prompt.trim(),
      answer: answer.trim(),
      distractors: cleanDistractors,
      aliases,
      reference: reference.trim(),
    });
  }

  return { rows, errors };
}

export function questionsToCsv(questions: Question[]) {
  const header = "stage,section,prompt,answer,option2,option3,option4,aliases,reference";
  const lines = questions.map((q) => {
    const distractors = q.options.filter((o) => o !== q.answer);
    const cells = [
      q.stage,
      q.section,
      q.prompt,
      q.answer,
      distractors[0] ?? "",
      distractors[1] ?? "",
      distractors[2] ?? "",
      q.aliases.join("|"),
      q.reference ?? "",
    ];
    return cells.map(csvEscape).join(",");
  });
  return [header, ...lines].join("\n");
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function downloadTextFile(filename: string, content: string, type = "text/csv") {
  const blob = new Blob([content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
