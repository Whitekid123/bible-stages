import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { STARTER_LECTURER } from "@/lib/bible/starter";
import { hashString, seededRng, shuffle, answersMatch } from "@/lib/utils";
import { scorePaper } from "@/lib/scoring";
import type { Question, SectionId, StageId } from "@/lib/bible/types";
import {
  bumpPack,
  ensureHall,
  fail,
  hashesMatch,
  loadCustomQuestions,
  settings,
  stripQuestion,
  toMeta,
  type QuestionRow,
} from "@/lib/hall-auth";

const STAGE = z.enum(["general", "little", "growing", "juniors", "youth"]);
const SECTION = z.enum(["objective", "blank"]);

function newQuestionId(stage: string, section: string) {
  return `c-${stage}-${section}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function withShuffledOptions(input: {
  id: string;
  stage: StageId;
  section: SectionId;
  prompt: string;
  answer: string;
  distractors: string[];
  aliases: string[];
  reference?: string;
  published: boolean;
}): Question {
  const rand = seededRng(hashString(input.id));
  const options =
    input.section === "objective"
      ? shuffle([input.answer, ...input.distractors.filter(Boolean).slice(0, 3)], rand)
      : input.distractors.length
        ? shuffle([input.answer, ...input.distractors.slice(0, 3)], rand)
        : [];
  return {
    id: input.id,
    stage: input.stage,
    section: input.section,
    prompt: input.prompt,
    options,
    answer: input.answer,
    aliases: input.aliases,
    reference: input.reference || undefined,
    source: "lecturer",
    published: input.published,
  };
}

async function insertQuestion(
  sql: Awaited<ReturnType<typeof ensureHall>>,
  q: Question,
) {
  const now = new Date().toISOString();
  await sql`
    insert into custom_questions (
      id, stage_id, section, prompt, options, answer, aliases, reference,
      published, created_at, updated_at, class_id
    ) values (
      ${q.id}, ${q.stage}, ${q.section}, ${q.prompt}, ${JSON.stringify(q.options)},
      ${q.answer}, ${JSON.stringify(q.aliases)}, ${q.reference ?? ""},
      ${q.published === false ? 0 : 1}, ${now}, ${now}, ${"hall"}
    )
  `;
}

export const downloadPack = createServerFn({ method: "POST" })
  .validator(
    z.object({
      password: z.string().min(1),
      role: z.enum(["student", "teacher"]),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row) return fail("The hall is not ready.");
    const ok =
      data.role === "teacher"
        ? hashesMatch(data.password, row.teacher_password_hash)
        : hashesMatch(data.password, row.class_password_hash);
    if (!ok) {
      return fail(
        data.role === "teacher"
          ? "That teacher password is not right."
          : "That class password is not right.",
      );
    }
    const custom = await loadCustomQuestions(sql, data.role === "student");
    const questions =
      data.role === "student" ? custom.filter((q) => q.published !== false).map(stripQuestion) : custom;
    return {
      ok: true as const,
      questions,
      meta: toMeta(row),
      downloadedAt: new Date().toISOString(),
    };
  });

export const listCustomQuestions = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.teacher_password_hash)) {
      return fail("That teacher password is not right.");
    }
    const questions = await loadCustomQuestions(sql, false);
    return { ok: true as const, questions, meta: toMeta(row) };
  });

const questionInput = z.object({
  password: z.string().min(1),
  id: z.string().min(1).optional(),
  stageId: STAGE,
  section: SECTION,
  prompt: z.string().trim().min(4).max(500),
  answer: z.string().trim().min(1).max(200),
  distractors: z.array(z.string().trim().max(200)).max(3).optional(),
  aliases: z.array(z.string().trim().max(80)).max(12).optional(),
  reference: z.string().trim().max(80).optional(),
  published: z.boolean().optional(),
});

export const saveCustomQuestion = createServerFn({ method: "POST" })
  .validator(questionInput)
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.teacher_password_hash)) {
      return fail("That teacher password is not right.");
    }
    const distractors = (data.distractors ?? []).map((d) => d.trim()).filter(Boolean);
    if (data.section === "objective" && distractors.length < 1) {
      return fail("Objective questions need at least one wrong option.");
    }
    const id = data.id ?? newQuestionId(data.stageId, data.section);
    const question = withShuffledOptions({
      id,
      stage: data.stageId,
      section: data.section,
      prompt: data.prompt,
      answer: data.answer,
      distractors,
      aliases: data.aliases ?? [],
      reference: data.reference,
      published: data.published ?? true,
    });
    const now = new Date().toISOString();
    if (data.id) {
      const existing = await sql<QuestionRow>`
        select * from custom_questions where id = ${data.id} limit 1
      `;
      if (!existing[0]) return fail("That question is not in the bank.");
      await sql`
        update custom_questions
        set stage_id = ${question.stage},
            section = ${question.section},
            prompt = ${question.prompt},
            options = ${JSON.stringify(question.options)},
            answer = ${question.answer},
            aliases = ${JSON.stringify(question.aliases)},
            reference = ${question.reference ?? ""},
            published = ${question.published === false ? 0 : 1},
            updated_at = ${now}
        where id = ${data.id}
      `;
    } else {
      await insertQuestion(sql, question);
    }
    await bumpPack(sql);
    const questions = await loadCustomQuestions(sql, false);
    const next = await settings(sql);
    return { ok: true as const, questions, meta: toMeta(next), question };
  });

export const deleteCustomQuestion = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1), id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.teacher_password_hash)) {
      return fail("That teacher password is not right.");
    }
    await sql`delete from custom_questions where id = ${data.id} and class_id = ${"hall"}`;
    await bumpPack(sql);
    const questions = await loadCustomQuestions(sql, false);
    const next = await settings(sql);
    return { ok: true as const, questions, meta: toMeta(next) };
  });

const importItem = z.object({
  stageId: STAGE,
  section: SECTION,
  prompt: z.string().trim().min(4).max(500),
  answer: z.string().trim().min(1).max(200),
  distractors: z.array(z.string().trim().max(200)).max(3),
  aliases: z.array(z.string().trim().max(80)).max(12),
  reference: z.string().trim().max(80).optional(),
});

export const importCustomQuestions = createServerFn({ method: "POST" })
  .validator(
    z.object({
      password: z.string().min(1),
      items: z.array(importItem).min(1).max(200),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.teacher_password_hash)) {
      return fail("That teacher password is not right.");
    }
    let added = 0;
    for (const item of data.items) {
      const question = withShuffledOptions({
        id: newQuestionId(item.stageId, item.section),
        stage: item.stageId,
        section: item.section,
        prompt: item.prompt,
        answer: item.answer,
        distractors: item.distractors,
        aliases: item.aliases,
        reference: item.reference,
        published: true,
      });
      await insertQuestion(sql, question);
      added += 1;
    }
    await bumpPack(sql);
    const questions = await loadCustomQuestions(sql, false);
    const next = await settings(sql);
    return { ok: true as const, questions, meta: toMeta(next), added };
  });

export const loadStarterSet = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.teacher_password_hash)) {
      return fail("That teacher password is not right.");
    }
    const existing = await loadCustomQuestions(sql, false);
    const prompts = new Set(existing.map((q) => q.prompt.toLowerCase()));
    let added = 0;
    for (const item of STARTER_LECTURER) {
      if (prompts.has(item.prompt.toLowerCase())) continue;
      const question: Question = {
        ...item,
        id: newQuestionId(item.stage, item.section),
      };
      await insertQuestion(sql, question);
      added += 1;
    }
    if (added) await bumpPack(sql);
    const questions = await loadCustomQuestions(sql, false);
    const next = await settings(sql);
    return { ok: true as const, questions, meta: toMeta(next), added };
  });

export const scorePractice = createServerFn({ method: "POST" })
  .validator(
    z.object({
      password: z.string().min(1),
      stageId: STAGE,
      questionIds: z.array(z.string()).min(1).max(40),
      answers: z.record(z.string(), z.string()),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.class_password_hash)) {
      return fail("That class password is not right.");
    }
    const { QUESTIONS, questionById } = await import("@/lib/bible/bank");
    const { mergeBank } = await import("@/lib/bible/pack");
    const meta = toMeta(row);
    const custom = await loadCustomQuestions(sql, true);
    const pool = mergeBank(custom, meta.bankMode, data.stageId);
    const questions = data.questionIds
      .map((id) => pool.find((q) => q.id === id) ?? questionById(id) ?? QUESTIONS.find((q) => q.id === id))
      .filter((q): q is Question => Boolean(q));
    const paper = {
      id: "practice",
      studentName: "practice",
      stageId: data.stageId,
      questionIds: questions.map((q) => q.id),
      answers: data.answers,
      tabLeaves: 0,
      startedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      timeUp: false,
      durationSec: 0,
      teacherNotes: "",
      blankMarks: {},
      questions,
    };
    const scored = scorePaper(paper);
    return {
      ok: true as const,
      score: { correct: scored.correct, total: scored.total, percent: scored.percent },
      review: questions.map((q) => {
        const given = data.answers[q.id] ?? "";
        return {
          id: q.id,
          prompt: q.prompt,
          section: q.section,
          given,
          answer: q.answer,
          ok: answersMatch(given, q.answer, q.aliases),
        };
      }),
    };
  });

export const loadRevisionCards = createServerFn({ method: "POST" })
  .validator(
    z.object({
      password: z.string().min(1),
      stageId: STAGE,
      count: z.number().int().min(4).max(24).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.class_password_hash)) {
      return fail("That class password is not right.");
    }
    const meta = toMeta(row);
    if (!meta.practiceOpen) {
      return fail("The teacher has closed revision for now.");
    }
    const { mergeBank } = await import("@/lib/bible/pack");
    const { pickN, hashString, seededRng } = await import("@/lib/utils");
    const custom = await loadCustomQuestions(sql, true);
    const pool = mergeBank(custom, meta.bankMode, data.stageId).filter((q) => q.answer);
    const rand = seededRng(hashString(`cards-${data.stageId}-${Math.floor(Date.now() / 180000)}`));
    const picked = pickN(pool, data.count ?? 12, rand);
    return {
      ok: true as const,
      cards: picked.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        answer: q.answer,
        reference: q.reference,
        section: q.section,
        stage: q.stage,
      })),
    };
  });
