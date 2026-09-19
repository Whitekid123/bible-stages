import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { durationFor, selectQuestions } from "@/lib/bible/select";
import type { Paper, Question, SeatWatch, StageId } from "@/lib/bible/types";
import { scorePaper } from "@/lib/scoring";
import {
  bumpPack,
  ensureHall,
  fail,
  hashPassword,
  hashesMatch,
  loadCustomQuestions,
  parseJson,
  parseSize,
  settings,
  stripQuestion,
  toMeta,
  toPaper,
  type PresenceRow,
  type ScriptRow,
} from "@/lib/hall-auth";

const STAGE = z.enum(["general", "little", "growing", "juniors", "youth"]);
const SIZE = z.union([z.literal(20), z.literal(40), z.literal("full")]);
const MODE = z.enum(["builtin", "mix", "custom"]);

function forStudent(paper: Paper, revealMarks: boolean): Paper {
  const questions = (paper.questions ?? []).map((q) =>
    revealMarks ? q : stripQuestion(q),
  );
  const scored =
    revealMarks && paper.submittedAt ? scorePaper({ ...paper, questions: paper.questions }) : null;
  return {
    ...paper,
    questions,
    teacherNotes: "",
    blankMarks: revealMarks ? paper.blankMarks : {},
    scoreCache: scored
      ? { correct: scored.correct, total: scored.total, percent: scored.percent }
      : undefined,
  };
}

function hydrateMissingQuestions(paper: Paper, custom: Question[]): Paper {
  if (paper.questions && paper.questions.length > 0) return paper;
  const questions = paper.questionIds
    .map((id) => custom.find((q) => q.id === id))
    .filter((q): q is Question => Boolean(q));
  return { ...paper, questions };
}

export const pingHall = createServerFn({ method: "POST" }).handler(async () => {
  await ensureHall();
  return { ok: true as const };
});

function toSeat(row: PresenceRow): SeatWatch {
  return {
    name: row.seat_label,
    role: row.role === "teacher" ? "teacher" : "student",
    paperId: row.paper_id,
    stageId: (row.stage_id as StageId | null) ?? null,
    inExam: Number(row.in_exam) === 1,
    hidden: Number(row.hidden) === 1,
    appLeaves: Number(row.app_leaves) || 0,
    tabLeaves: Number(row.tab_leaves) || 0,
    answersSaved: Number(row.answers_saved) || 0,
    lastSeen: row.last_seen,
  };
}

export const beatHall = createServerFn({ method: "POST" })
  .validator(
    z.object({
      password: z.string().min(1),
      candidate: z.string().trim().min(2).max(80),
      paperId: z.string().optional(),
      stageId: STAGE.optional(),
      hidden: z.boolean(),
      inExam: z.boolean(),
      tabLeaves: z.number().int().min(0).optional(),
      answersSaved: z.number().int().min(0).optional(),
      appLeave: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.class_password_hash)) {
      return fail("That class password is not right.");
    }
    const now = new Date().toISOString();
    const appInc = data.appLeave ? 1 : 0;
    await sql`
      insert into hall_presence (
        seat_label, role, paper_id, stage_id, in_exam, hidden, app_leaves, tab_leaves, answers_saved, last_seen
      ) values (
        ${data.candidate}, ${"student"}, ${data.paperId ?? null}, ${data.stageId ?? null},
        ${data.inExam ? 1 : 0}, ${data.hidden ? 1 : 0}, ${appInc}, ${data.tabLeaves ?? 0},
        ${data.answersSaved ?? 0}, ${now}
      )
      on conflict (seat_label) do update set
        paper_id = excluded.paper_id,
        stage_id = excluded.stage_id,
        in_exam = excluded.in_exam,
        hidden = excluded.hidden,
        app_leaves = hall_presence.app_leaves + ${appInc},
        tab_leaves = excluded.tab_leaves,
        answers_saved = excluded.answers_saved,
        last_seen = excluded.last_seen
    `;
    if (data.paperId) {
      await sql`
        update scripts
        set last_seen = ${now},
            hidden = ${data.hidden ? 1 : 0},
            tab_leaves = ${data.tabLeaves ?? 0},
            app_leaves = app_leaves + ${appInc}
        where id = ${data.paperId} and submitted_at is null
      `;
    }
    return { ok: true as const };
  });

export const leaveHall = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1), candidate: z.string().trim().min(2).max(80) }))
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.class_password_hash)) {
      return fail("That class password is not right.");
    }
    await sql`delete from hall_presence where seat_label = ${data.candidate}`;
    return { ok: true as const };
  });


export const verifyClassPassword = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.class_password_hash)) {
      return fail("That class password is not right.");
    }
    return { ok: true as const, examSize: parseSize(row.exam_size), meta: toMeta(row) };
  });

export const verifyTeacherPassword = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.teacher_password_hash)) {
      return fail("That teacher password is not right.");
    }
    return { ok: true as const, examSize: parseSize(row.exam_size), meta: toMeta(row) };
  });

export const startScript = createServerFn({ method: "POST" })
  .validator(
    z.object({
      password: z.string().min(1),
      candidate: z.string().trim().min(2).max(80),
      stageId: STAGE,
    }),
  )
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.class_password_hash)) {
      return fail("That class password is not right.");
    }
    const meta = toMeta(row);
    if (!meta.sittingOpen) {
      return fail("The teacher has closed sittings for now. You can still keep the packed questions on this device.");
    }
    const open = await sql<ScriptRow>`
      select * from scripts
      where seat_label = ${data.candidate}
        and stage_id = ${data.stageId}
        and submitted_at is null
      order by started_at desc
      limit 1
    `;
    if (open[0]) {
      return { ok: true as const, paper: forStudent(toPaper(open[0], { reveal: true }), false) };
    }

    const custom = await loadCustomQuestions(sql, true);
    const size = meta.examSize;
    const id = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const selected = selectQuestions(data.stageId, size, id, custom, meta.bankMode);
    if (selected.length === 0) {
      return fail("This stage has no questions yet. Ask the teacher to add some to the bank.");
    }
    const startedAt = new Date().toISOString();
    const durationSec = durationFor(data.stageId, size, selected.length);
    const questionIds = JSON.stringify(selected.map((q) => q.id));
    const questionsJson = JSON.stringify(selected);
    await sql`
      insert into scripts (
        id, seat_label, stage_id, question_ids, questions_json, answers, tab_leaves,
        started_at, submitted_at, time_up, duration_sec, teacher_notes, blank_marks, class_id
      ) values (
        ${id}, ${data.candidate}, ${data.stageId}, ${questionIds}, ${questionsJson}, ${"{}"}, ${0},
        ${startedAt}, ${null}, ${0}, ${durationSec}, ${""}, ${"{}"}, ${"hall"}
      )
    `;
    const paper: Paper = {
      id,
      studentName: data.candidate,
      stageId: data.stageId as StageId,
      questionIds: selected.map((q) => q.id),
      answers: {},
      tabLeaves: 0,
      startedAt,
      submittedAt: null,
      timeUp: false,
      durationSec,
      teacherNotes: "",
      blankMarks: {},
      questions: selected,
    };
    return { ok: true as const, paper: forStudent(paper, false) };
  });

export const saveScriptProgress = createServerFn({ method: "POST" })
  .validator(
    z.object({
      password: z.string().min(1),
      paperId: z.string().min(1),
      answers: z.record(z.string(), z.string()),
      tabLeaves: z.number().int().min(0),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.class_password_hash)) {
      return fail("That class password is not right.");
    }
    await sql`
      update scripts
      set answers = ${JSON.stringify(data.answers)}, tab_leaves = ${data.tabLeaves}
      where id = ${data.paperId} and submitted_at is null
    `;
    return { ok: true as const };
  });

export const submitScript = createServerFn({ method: "POST" })
  .validator(
    z.object({
      password: z.string().min(1),
      paperId: z.string().min(1),
      answers: z.record(z.string(), z.string()),
      tabLeaves: z.number().int().min(0),
      timeUp: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.class_password_hash)) {
      return fail("That class password is not right.");
    }
    const existing = await sql<ScriptRow>`select * from scripts where id = ${data.paperId} limit 1`;
    if (!existing[0]) return fail("That paper was not started in the hall.");
    const meta = toMeta(row);
    if (existing[0].submitted_at) {
      return {
        ok: true as const,
        paper: forStudent(toPaper(existing[0], { reveal: true }), meta.releaseMarks),
      };
    }
    const submittedAt = new Date().toISOString();
    await sql`
      update scripts
      set answers = ${JSON.stringify(data.answers)},
          tab_leaves = ${data.tabLeaves},
          submitted_at = ${submittedAt},
          time_up = ${data.timeUp ? 1 : 0}
      where id = ${data.paperId} and submitted_at is null
    `;
    return {
      ok: true as const,
      paper: forStudent(
        toPaper(
          {
            ...existing[0],
            answers: JSON.stringify(data.answers),
            tab_leaves: data.tabLeaves,
            submitted_at: submittedAt,
            time_up: data.timeUp ? 1 : 0,
          },
          { reveal: true },
        ),
        meta.releaseMarks,
      ),
    };
  });

export const listScripts = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.teacher_password_hash)) {
      return fail("That teacher password is not right.");
    }
    const custom = await loadCustomQuestions(sql, false);
    const rows = await sql<ScriptRow>`
      select * from scripts where class_id = ${"hall"} order by started_at desc
    `;
    let seats: PresenceRow[] = [];
    try {
      seats = await sql<PresenceRow>`select * from hall_presence order by last_seen desc`;
    } catch {
      seats = [];
    }
    return {
      ok: true as const,
      papers: rows.map((r) => hydrateMissingQuestions(toPaper(r, { reveal: true, custom }), custom)),
      presence: seats.map(toSeat),
      examSize: parseSize(row.exam_size),
      meta: toMeta(row),
    };
  });

export const getScript = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1), paperId: z.string().min(1) }))
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.teacher_password_hash)) {
      return fail("That teacher password is not right.");
    }
    const custom = await loadCustomQuestions(sql, false);
    const rows = await sql<ScriptRow>`select * from scripts where id = ${data.paperId} limit 1`;
    if (!rows[0]) return fail("That script is not in the hall.");
    return {
      ok: true as const,
      paper: hydrateMissingQuestions(toPaper(rows[0], { reveal: true, custom }), custom),
    };
  });

export const listMyScripts = createServerFn({ method: "POST" })
  .validator(
    z.object({
      password: z.string().min(1),
      candidate: z.string().trim().min(2).max(80),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.class_password_hash)) {
      return fail("That class password is not right.");
    }
    const meta = toMeta(row);
    const rows = await sql<ScriptRow>`
      select * from scripts
      where class_id = ${"hall"} and seat_label = ${data.candidate}
      order by started_at desc
    `;
    return {
      ok: true as const,
      papers: rows.map((r) => forStudent(toPaper(r, { reveal: true }), meta.releaseMarks)),
      meta,
    };
  });

export const markScript = createServerFn({ method: "POST" })
  .validator(
    z.object({
      password: z.string().min(1),
      paperId: z.string().min(1),
      questionId: z.string().min(1),
      mark: z.enum(["correct", "wrong", "unset"]),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.teacher_password_hash)) {
      return fail("That teacher password is not right.");
    }
    const rows = await sql<ScriptRow>`select * from scripts where id = ${data.paperId} limit 1`;
    if (!rows[0]) return fail("That script is not in the hall.");
    const marks = parseJson<Record<string, "correct" | "wrong" | "unset">>(rows[0].blank_marks, {});
    marks[data.questionId] = data.mark;
    await sql`update scripts set blank_marks = ${JSON.stringify(marks)} where id = ${data.paperId}`;
    return { ok: true as const, paper: toPaper({ ...rows[0], blank_marks: JSON.stringify(marks) }) };
  });

export const noteScript = createServerFn({ method: "POST" })
  .validator(
    z.object({
      password: z.string().min(1),
      paperId: z.string().min(1),
      notes: z.string().max(2000),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.teacher_password_hash)) {
      return fail("That teacher password is not right.");
    }
    await sql`update scripts set teacher_notes = ${data.notes} where id = ${data.paperId}`;
    const rows = await sql<ScriptRow>`select * from scripts where id = ${data.paperId} limit 1`;
    if (!rows[0]) return fail("That script is not in the hall.");
    return { ok: true as const, paper: toPaper(rows[0]) };
  });

export const updateHallSettings = createServerFn({ method: "POST" })
  .validator(
    z.object({
      password: z.string().min(1),
      examSize: SIZE.optional(),
      classPassword: z.string().min(1).max(80).optional(),
      teacherPassword: z.string().min(1).max(80).optional(),
      notice: z.string().max(600).optional(),
      sittingOpen: z.boolean().optional(),
      bankMode: MODE.optional(),
      practiceOpen: z.boolean().optional(),
      releaseMarks: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.teacher_password_hash)) {
      return fail("That teacher password is not right.");
    }
    const examSize = data.examSize ? String(data.examSize) : row.exam_size;
    const classHash = data.classPassword ? hashPassword(data.classPassword) : row.class_password_hash;
    const teacherHash = data.teacherPassword
      ? hashPassword(data.teacherPassword)
      : row.teacher_password_hash;
    const notice = data.notice !== undefined ? data.notice : (row.notice ?? "");
    const sittingOpen =
      data.sittingOpen !== undefined ? (data.sittingOpen ? 1 : 0) : Number(row.sitting_open ?? 1);
    const bankMode = data.bankMode ?? row.bank_mode ?? "mix";
    const practiceOpen =
      data.practiceOpen !== undefined ? (data.practiceOpen ? 1 : 0) : Number(row.practice_open ?? 1);
    const releaseMarks =
      data.releaseMarks !== undefined ? (data.releaseMarks ? 1 : 0) : Number(row.release_marks ?? 0);
    await sql`
      update hall_settings
      set exam_size = ${examSize},
          class_password_hash = ${classHash},
          teacher_password_hash = ${teacherHash},
          notice = ${notice},
          sitting_open = ${sittingOpen},
          bank_mode = ${bankMode},
          practice_open = ${practiceOpen},
          release_marks = ${releaseMarks}
      where id = ${"hall"}
    `;
    if (data.bankMode || data.notice !== undefined) {
      await bumpPack(sql);
    }
    const next = await settings(sql);
    return { ok: true as const, examSize: parseSize(examSize), meta: toMeta(next) };
  });

export const listHonourBoard = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const sql = await ensureHall();
    const row = await settings(sql);
    if (!row || !hashesMatch(data.password, row.class_password_hash)) {
      return fail("That class password is not right.");
    }
    const meta = toMeta(row);
    if (!meta.releaseMarks) {
      return { ok: true as const, open: false as const, rows: [], meta };
    }
    const custom = await loadCustomQuestions(sql, false);
    const rows = await sql<ScriptRow>`
      select * from scripts
      where class_id = ${"hall"} and submitted_at is not null
      order by submitted_at desc
    `;
    const board = rows
      .map((script) => {
        const paper = hydrateMissingQuestions(toPaper(script, { reveal: true, custom }), custom);
        const score = scorePaper(paper, custom);
        return {
          paperId: paper.id,
          name: paper.studentName,
          stageId: paper.stageId,
          percent: score.percent,
          correct: score.correct,
          total: score.total,
          submittedAt: paper.submittedAt ?? "",
        };
      })
      .sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name));
    return { ok: true as const, open: true as const, rows: board, meta };
  });
