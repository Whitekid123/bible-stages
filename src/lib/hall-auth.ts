import { createHash, timingSafeEqual } from "node:crypto";
import { parseBankMode } from "@/lib/bible/pack";
import type { ExamSize, HallMeta, Paper, Question, StageId } from "@/lib/bible/types";
import { scorePaper } from "@/lib/scoring";

export type ScriptRow = {
  id: string;
  seat_label: string;
  stage_id: string;
  question_ids: string;
  answers: string;
  tab_leaves: number;
  app_leaves?: number | string | null;
  last_seen?: string | null;
  hidden?: number | string | null;
  extra_sec?: number | string | null;
  started_at: string;
  submitted_at: string | null;
  time_up: number;
  duration_sec: number;
  teacher_notes: string;
  blank_marks: string;
  questions_json?: string | null;
};

export type SettingsRow = {
  class_password_hash: string;
  teacher_password_hash: string;
  exam_size: string;
  notice?: string | null;
  sitting_open?: number | string | null;
  bank_mode?: string | null;
  pack_version?: number | string | null;
  practice_open?: number | string | null;
  release_marks?: number | string | null;
};

export type QuestionRow = {
  id: string;
  stage_id: string;
  section: string;
  prompt: string;
  options: string;
  answer: string;
  aliases: string;
  reference: string;
  published: number;
  created_at: string;
  updated_at: string;
};

export type PresenceRow = {
  seat_label: string;
  role: string;
  paper_id: string | null;
  stage_id: string | null;
  in_exam: number | string;
  hidden: number | string;
  app_leaves: number | string;
  tab_leaves: number | string;
  answers_saved: number | string;
  last_seen: string;
};

export function hashPassword(password: string) {
  return createHash("sha256").update(`bible-stages:${password}`).digest("hex");
}

export function hashesMatch(password: string, storedHex: string) {
  const a = Buffer.from(hashPassword(password), "hex");
  const b = Buffer.from(storedHex, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function parseSize(value: string): ExamSize {
  if (value === "full") return "full";
  if (value === "40") return 40;
  return 20;
}

export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function onFlag(value: number | string | null | undefined, fallback = true) {
  if (value === null || value === undefined || value === "") return fallback;
  return Number(value) === 1;
}

export function toMeta(row: SettingsRow): HallMeta {
  return {
    examSize: parseSize(row.exam_size),
    notice: row.notice ?? "",
    sittingOpen: onFlag(row.sitting_open, true),
    bankMode: parseBankMode(row.bank_mode),
    packVersion: Number(row.pack_version) || 1,
    practiceOpen: onFlag(row.practice_open, true),
    releaseMarks: onFlag(row.release_marks, false),
  };
}

export function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    stage: row.stage_id as StageId,
    section: row.section === "blank" ? "blank" : "objective",
    prompt: row.prompt,
    options: parseJson<string[]>(row.options, []),
    answer: row.answer,
    aliases: parseJson<string[]>(row.aliases, []),
    reference: row.reference || undefined,
    source: "lecturer",
    published: Number(row.published) === 1,
  };
}

export function stripQuestion(q: Question): Question {
  return { ...q, answer: "", aliases: [] };
}

export function toPaper(row: ScriptRow, opts?: { reveal?: boolean; custom?: Question[] }): Paper {
  const snapshot = parseJson<Question[]>(row.questions_json, []);
  const reveal = opts?.reveal ?? true;
  const questions = reveal ? snapshot : snapshot.map(stripQuestion);
  const paper: Paper = {
    id: row.id,
    studentName: row.seat_label,
    stageId: row.stage_id as StageId,
    questionIds: parseJson<string[]>(row.question_ids, []),
    answers: parseJson<Record<string, string>>(row.answers, {}),
    tabLeaves: Number(row.tab_leaves) || 0,
    appLeaves: Number(row.app_leaves) || 0,
    hidden: Number(row.hidden) === 1,
    lastSeen: row.last_seen || undefined,
    extraSec: Number(row.extra_sec) || 0,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
    timeUp: Number(row.time_up) === 1,
    durationSec: Number(row.duration_sec) || 0,
    teacherNotes: reveal ? (row.teacher_notes ?? "") : "",
    blankMarks: parseJson<Record<string, "correct" | "wrong" | "unset">>(row.blank_marks, {}),
    questions,
  };
  if (reveal && questions.some((q) => q.answer)) {
    const scored = scorePaper(paper, opts?.custom ?? []);
    paper.scoreCache = {
      correct: scored.correct,
      total: scored.total,
      percent: scored.percent,
    };
  }
  return paper;
}

export function fail(error: string) {
  return { ok: false as const, error };
}

export async function getDb() {
  const { getSql } = await import("@/lib/db");
  return getSql();
}

export async function ensureHall() {
  const sql = await getDb();
  const rows = await sql<{ id: string }>`select id from hall_settings where id = ${"hall"}`;
  if (rows.length === 0) {
    await sql`
      insert into hall_settings (id, class_password_hash, teacher_password_hash, exam_size)
      values (
        ${"hall"},
        ${"9ad76fba1356d94c36c7e90da7089e42ac4be08abc138c11be0b6b877d3750bd"},
        ${"0103da4241b637e287daee74abf82bd26c9c8e926a00918843dbc152c108bbed"},
        ${"20"}
      )
    `;
  }
  return sql;
}

export async function settings(sql: Awaited<ReturnType<typeof getDb>>) {
  const rows = await sql<SettingsRow>`
    select class_password_hash, teacher_password_hash, exam_size, notice, sitting_open,
           bank_mode, pack_version, practice_open, release_marks
    from hall_settings where id = ${"hall"}
  `;
  return rows[0];
}

export async function bumpPack(sql: Awaited<ReturnType<typeof getDb>>) {
  await sql`update hall_settings set pack_version = pack_version + 1 where id = ${"hall"}`;
}

export async function loadCustomQuestions(
  sql: Awaited<ReturnType<typeof getDb>>,
  publishedOnly = false,
) {
  const rows = publishedOnly
    ? await sql<QuestionRow>`
        select * from custom_questions
        where class_id = ${"hall"} and published = ${1}
        order by created_at asc
      `
    : await sql<QuestionRow>`
        select * from custom_questions
        where class_id = ${"hall"}
        order by created_at asc
      `;
  return rows.map(toQuestion);
}
