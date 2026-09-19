import { STARTER_LECTURER } from "@/lib/bible/starter";
import { durationFor, selectQuestions } from "@/lib/bible/select";
import { DEFAULT_META, mergeBank } from "@/lib/bible/pack";
import { QUESTIONS, questionById } from "@/lib/bible/bank";
import { scorePaper } from "@/lib/scoring";
import { answersMatch, hashString, pickN, seededRng, shuffle } from "@/lib/utils";
import type {
  BankMode,
  ExamSize,
  HallMeta,
  HonourRow,
  Paper,
  Question,
  SeatWatch,
  StageId,
} from "@/lib/bible/types";

const STORAGE_KEY = "bible-stages-device-hall";

type HallState = {
  classPassword: string;
  teacherPassword: string;
  examSize: ExamSize;
  notice: string;
  sittingOpen: boolean;
  bankMode: BankMode;
  packVersion: number;
  practiceOpen: boolean;
  releaseMarks: boolean;
  questions: Question[];
  papers: Paper[];
  presence: SeatWatch[];
};

type Fn<T> = { data: T };

function fail(error: string) {
  return { ok: false as const, error };
}

function emptyHall(): HallState {
  return {
    classPassword: "class",
    teacherPassword: "teacher",
    examSize: 20,
    notice: "",
    sittingOpen: true,
    bankMode: "mix",
    packVersion: 1,
    practiceOpen: true,
    releaseMarks: false,
    questions: [],
    papers: [],
    presence: [],
  };
}

function readHall(): HallState {
  if (typeof localStorage === "undefined") return emptyHall();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyHall();
    const parsed = JSON.parse(raw) as Partial<HallState>;
    return { ...emptyHall(), ...parsed, papers: parsed.papers ?? [], questions: parsed.questions ?? [], presence: parsed.presence ?? [] };
  } catch {
    return emptyHall();
  }
}

function writeHall(state: HallState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function metaOf(state: HallState): HallMeta {
  return {
    examSize: state.examSize,
    notice: state.notice,
    sittingOpen: state.sittingOpen,
    bankMode: state.bankMode,
    packVersion: state.packVersion,
    practiceOpen: state.practiceOpen,
    releaseMarks: state.releaseMarks,
  };
}

function stripQuestion(question: Question): Question {
  return { ...question, answer: "", aliases: [] };
}

function forStudent(paper: Paper, revealMarks: boolean): Paper {
  const questions = (paper.questions ?? []).map((q) => (revealMarks ? q : stripQuestion(q)));
  const scored =
    revealMarks && paper.submittedAt ? scorePaper({ ...paper, questions: paper.questions }) : null;
  return {
    ...paper,
    questions,
    teacherNotes: revealMarks ? paper.teacherNotes : "",
    blankMarks: revealMarks ? paper.blankMarks : {},
    scoreCache: scored
      ? { correct: scored.correct, total: scored.total, percent: scored.percent }
      : undefined,
  };
}

function newQuestionId(stage: string, section: string) {
  return `c-${stage}-${section}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function withShuffledOptions(input: {
  id: string;
  stage: StageId;
  section: Question["section"];
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

function requireClass(password: string, state: HallState) {
  return password === state.classPassword;
}

function requireTeacher(password: string, state: HallState) {
  return password === state.teacherPassword;
}

export async function pingHall() {
  return { ok: true as const };
}

export async function beatHall({
  data,
}: Fn<{
  password: string;
  candidate: string;
  paperId?: string;
  stageId?: StageId;
  hidden: boolean;
  inExam: boolean;
  tabLeaves?: number;
  answersSaved?: number;
  appLeave?: boolean;
}>) {
  const state = readHall();
  if (!requireClass(data.password, state)) return fail("That class password is not right.");
  const now = new Date().toISOString();
  const existing = state.presence.find((seat) => seat.name === data.candidate);
  const next: SeatWatch = {
    name: data.candidate,
    role: "student",
    paperId: data.paperId ?? existing?.paperId ?? null,
    stageId: data.stageId ?? existing?.stageId ?? null,
    inExam: data.inExam,
    hidden: data.hidden,
    appLeaves: (existing?.appLeaves ?? 0) + (data.appLeave ? 1 : 0),
    tabLeaves: data.tabLeaves ?? existing?.tabLeaves ?? 0,
    answersSaved: data.answersSaved ?? existing?.answersSaved ?? 0,
    lastSeen: now,
  };
  state.presence = [next, ...state.presence.filter((seat) => seat.name !== data.candidate)];
  if (data.paperId) {
    state.papers = state.papers.map((paper) =>
      paper.id === data.paperId && !paper.submittedAt
        ? {
            ...paper,
            hidden: data.hidden,
            lastSeen: now,
            tabLeaves: data.tabLeaves ?? paper.tabLeaves,
            appLeaves: (paper.appLeaves ?? 0) + (data.appLeave ? 1 : 0),
          }
        : paper,
    );
  }
  writeHall(state);
  return { ok: true as const };
}

export async function leaveHall({ data }: Fn<{ password: string; candidate: string }>) {
  const state = readHall();
  if (!requireClass(data.password, state)) return fail("That class password is not right.");
  state.presence = state.presence.filter((seat) => seat.name !== data.candidate);
  writeHall(state);
  return { ok: true as const };
}

export async function verifyClassPassword({ data }: Fn<{ password: string }>) {
  const state = readHall();
  if (!requireClass(data.password, state)) return fail("That class password is not right.");
  return { ok: true as const, examSize: state.examSize, meta: metaOf(state) };
}

export async function verifyTeacherPassword({ data }: Fn<{ password: string }>) {
  const state = readHall();
  if (!requireTeacher(data.password, state)) return fail("That teacher password is not right.");
  return { ok: true as const, examSize: state.examSize, meta: metaOf(state) };
}

export async function downloadPack({
  data,
}: Fn<{ password: string; role: "student" | "teacher" }>) {
  const state = readHall();
  const ok =
    data.role === "teacher"
      ? requireTeacher(data.password, state)
      : requireClass(data.password, state);
  if (!ok) {
    return fail(
      data.role === "teacher"
        ? "That teacher password is not right."
        : "That class password is not right.",
    );
  }
  const custom =
    data.role === "student"
      ? state.questions.filter((q) => q.published !== false).map(stripQuestion)
      : state.questions;
  return {
    ok: true as const,
    questions: custom,
    meta: metaOf(state),
    downloadedAt: new Date().toISOString(),
  };
}

export async function startScript({
  data,
}: Fn<{ password: string; candidate: string; stageId: StageId }>) {
  const state = readHall();
  if (!requireClass(data.password, state)) return fail("That class password is not right.");
  if (!state.sittingOpen) {
    return fail(
      "The teacher has closed sittings for now. You can still keep the packed questions on this device.",
    );
  }
  const open = state.papers.find(
    (paper) =>
      paper.studentName === data.candidate && paper.stageId === data.stageId && !paper.submittedAt,
  );
  if (open) return { ok: true as const, paper: forStudent(open, false) };

  const selected = selectQuestions(
    data.stageId,
    state.examSize,
    `${data.candidate}-${Date.now()}`,
    state.questions,
    state.bankMode,
  );
  if (selected.length === 0) {
    return fail("This stage has no questions yet. Ask the teacher to add some to the bank.");
  }
  const startedAt = new Date().toISOString();
  const paper: Paper = {
    id: `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    studentName: data.candidate,
    stageId: data.stageId,
    questionIds: selected.map((q) => q.id),
    answers: {},
    tabLeaves: 0,
    appLeaves: 0,
    hidden: false,
    lastSeen: startedAt,
    startedAt,
    submittedAt: null,
    timeUp: false,
    durationSec: durationFor(data.stageId, state.examSize, selected.length),
    teacherNotes: "",
    blankMarks: {},
    questions: selected,
  };
  state.papers = [paper, ...state.papers];
  writeHall(state);
  return { ok: true as const, paper: forStudent(paper, false) };
}

export async function saveScriptProgress({
  data,
}: Fn<{
  password: string;
  paperId: string;
  answers: Record<string, string>;
  tabLeaves: number;
}>) {
  const state = readHall();
  if (!requireClass(data.password, state)) return fail("That class password is not right.");
  state.papers = state.papers.map((paper) =>
    paper.id === data.paperId && !paper.submittedAt
      ? { ...paper, answers: data.answers, tabLeaves: data.tabLeaves }
      : paper,
  );
  writeHall(state);
  return { ok: true as const };
}

export async function submitScript({
  data,
}: Fn<{
  password: string;
  paperId: string;
  answers: Record<string, string>;
  tabLeaves: number;
  timeUp: boolean;
}>) {
  const state = readHall();
  if (!requireClass(data.password, state)) return fail("That class password is not right.");
  const existing = state.papers.find((paper) => paper.id === data.paperId);
  if (!existing) return fail("That paper was not started in the hall.");
  if (existing.submittedAt) {
    return { ok: true as const, paper: forStudent(existing, state.releaseMarks) };
  }
  const submittedAt = new Date().toISOString();
  const next: Paper = {
    ...existing,
    answers: data.answers,
    tabLeaves: data.tabLeaves,
    submittedAt,
    timeUp: data.timeUp,
    pendingSubmit: false,
  };
  state.papers = state.papers.map((paper) => (paper.id === data.paperId ? next : paper));
  writeHall(state);
  return { ok: true as const, paper: forStudent(next, state.releaseMarks) };
}

export async function listScripts({ data }: Fn<{ password: string }>) {
  const state = readHall();
  if (!requireTeacher(data.password, state)) return fail("That teacher password is not right.");
  return {
    ok: true as const,
    papers: state.papers,
    presence: state.presence,
    examSize: state.examSize,
    meta: metaOf(state),
  };
}

export async function getScript({ data }: Fn<{ password: string; paperId: string }>) {
  const state = readHall();
  if (!requireTeacher(data.password, state)) return fail("That teacher password is not right.");
  const paper = state.papers.find((item) => item.id === data.paperId);
  if (!paper) return fail("That script is not in the hall.");
  return { ok: true as const, paper };
}

export async function listMyScripts({
  data,
}: Fn<{ password: string; candidate: string }>) {
  const state = readHall();
  if (!requireClass(data.password, state)) return fail("That class password is not right.");
  return {
    ok: true as const,
    papers: state.papers
      .filter((paper) => paper.studentName === data.candidate)
      .map((paper) => forStudent(paper, state.releaseMarks)),
    meta: metaOf(state),
  };
}

export async function markScript({
  data,
}: Fn<{
  password: string;
  paperId: string;
  questionId: string;
  mark: "correct" | "wrong" | "unset";
}>) {
  const state = readHall();
  if (!requireTeacher(data.password, state)) return fail("That teacher password is not right.");
  const existing = state.papers.find((paper) => paper.id === data.paperId);
  if (!existing) return fail("That script is not in the hall.");
  const paper: Paper = {
    ...existing,
    blankMarks: { ...existing.blankMarks, [data.questionId]: data.mark },
  };
  state.papers = state.papers.map((item) => (item.id === data.paperId ? paper : item));
  writeHall(state);
  return { ok: true as const, paper };
}

export async function noteScript({
  data,
}: Fn<{ password: string; paperId: string; notes: string }>) {
  const state = readHall();
  if (!requireTeacher(data.password, state)) return fail("That teacher password is not right.");
  const existing = state.papers.find((paper) => paper.id === data.paperId);
  if (!existing) return fail("That script is not in the hall.");
  const paper = { ...existing, teacherNotes: data.notes };
  state.papers = state.papers.map((item) => (item.id === data.paperId ? paper : item));
  writeHall(state);
  return { ok: true as const, paper };
}

export async function updateHallSettings({
  data,
}: Fn<{
  password: string;
  examSize?: ExamSize;
  classPassword?: string;
  teacherPassword?: string;
  notice?: string;
  sittingOpen?: boolean;
  bankMode?: BankMode;
  practiceOpen?: boolean;
  releaseMarks?: boolean;
}>) {
  const state = readHall();
  if (!requireTeacher(data.password, state)) return fail("That teacher password is not right.");
  if (data.examSize) state.examSize = data.examSize;
  if (data.classPassword) state.classPassword = data.classPassword;
  if (data.teacherPassword) state.teacherPassword = data.teacherPassword;
  if (data.notice !== undefined) state.notice = data.notice;
  if (data.sittingOpen !== undefined) state.sittingOpen = data.sittingOpen;
  if (data.bankMode) state.bankMode = data.bankMode;
  if (data.practiceOpen !== undefined) state.practiceOpen = data.practiceOpen;
  if (data.releaseMarks !== undefined) state.releaseMarks = data.releaseMarks;
  if (data.bankMode || data.notice !== undefined) state.packVersion += 1;
  writeHall(state);
  return { ok: true as const, examSize: state.examSize, meta: metaOf(state) };
}

export async function listHonourBoard({ data }: Fn<{ password: string }>) {
  const state = readHall();
  if (!requireClass(data.password, state)) return fail("That class password is not right.");
  const meta = metaOf(state);
  if (!state.releaseMarks) return { ok: true as const, open: false as const, rows: [] as HonourRow[], meta };
  const rows = state.papers
    .filter((paper) => paper.submittedAt)
    .map((paper) => {
      const score = scorePaper(paper, state.questions);
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
  return { ok: true as const, open: true as const, rows, meta };
}

export async function saveCustomQuestion({
  data,
}: Fn<{
  password: string;
  id?: string;
  stageId: StageId;
  section: Question["section"];
  prompt: string;
  answer: string;
  distractors?: string[];
  aliases?: string[];
  reference?: string;
  published?: boolean;
}>) {
  const state = readHall();
  if (!requireTeacher(data.password, state)) return fail("That teacher password is not right.");
  const distractors = (data.distractors ?? []).map((d) => d.trim()).filter(Boolean);
  if (data.section === "objective" && distractors.length < 1) {
    return fail("Objective questions need at least one wrong option.");
  }
  const question = withShuffledOptions({
    id: data.id ?? newQuestionId(data.stageId, data.section),
    stage: data.stageId,
    section: data.section,
    prompt: data.prompt,
    answer: data.answer,
    distractors,
    aliases: data.aliases ?? [],
    reference: data.reference,
    published: data.published ?? true,
  });
  if (data.id) {
    if (!state.questions.some((item) => item.id === data.id)) {
      return fail("That question is not in the bank.");
    }
    state.questions = state.questions.map((item) => (item.id === data.id ? question : item));
  } else {
    state.questions = [question, ...state.questions];
  }
  state.packVersion += 1;
  writeHall(state);
  return { ok: true as const, questions: state.questions, meta: metaOf(state), question };
}

export async function deleteCustomQuestion({ data }: Fn<{ password: string; id: string }>) {
  const state = readHall();
  if (!requireTeacher(data.password, state)) return fail("That teacher password is not right.");
  state.questions = state.questions.filter((item) => item.id !== data.id);
  state.packVersion += 1;
  writeHall(state);
  return { ok: true as const, questions: state.questions, meta: metaOf(state) };
}

export async function importCustomQuestions({
  data,
}: Fn<{
  password: string;
  items: {
    stageId: StageId;
    section: Question["section"];
    prompt: string;
    answer: string;
    distractors: string[];
    aliases: string[];
    reference?: string;
  }[];
}>) {
  const state = readHall();
  if (!requireTeacher(data.password, state)) return fail("That teacher password is not right.");
  let added = 0;
  for (const item of data.items) {
    state.questions.unshift(
      withShuffledOptions({
        id: newQuestionId(item.stageId, item.section),
        stage: item.stageId,
        section: item.section,
        prompt: item.prompt,
        answer: item.answer,
        distractors: item.distractors,
        aliases: item.aliases,
        reference: item.reference,
        published: true,
      }),
    );
    added += 1;
  }
  state.packVersion += 1;
  writeHall(state);
  return { ok: true as const, questions: state.questions, meta: metaOf(state), added };
}

export async function loadStarterSet({ data }: Fn<{ password: string }>) {
  const state = readHall();
  if (!requireTeacher(data.password, state)) return fail("That teacher password is not right.");
  const prompts = new Set(state.questions.map((q) => q.prompt.toLowerCase()));
  let added = 0;
  for (const item of STARTER_LECTURER) {
    if (prompts.has(item.prompt.toLowerCase())) continue;
    state.questions.unshift({ ...item, id: newQuestionId(item.stage, item.section) });
    added += 1;
  }
  if (added) state.packVersion += 1;
  writeHall(state);
  return { ok: true as const, questions: state.questions, meta: metaOf(state), added };
}

export async function scorePractice({
  data,
}: Fn<{
  password: string;
  stageId: StageId;
  questionIds: string[];
  answers: Record<string, string>;
}>) {
  const state = readHall();
  if (!requireClass(data.password, state)) return fail("That class password is not right.");
  const pool = mergeBank(state.questions, state.bankMode, data.stageId);
  const questions = data.questionIds
    .map((id) => pool.find((q) => q.id === id) ?? questionById(id) ?? QUESTIONS.find((q) => q.id === id))
    .filter((q): q is Question => Boolean(q));
  const paper: Paper = {
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
}

export async function loadRevisionCards({
  data,
}: Fn<{ password: string; stageId: StageId; count?: number }>) {
  const state = readHall();
  if (!requireClass(data.password, state)) return fail("That class password is not right.");
  if (!state.practiceOpen) return fail("The teacher has closed revision for now.");
  const pool = mergeBank(state.questions, state.bankMode, data.stageId).filter((q) => q.answer);
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
}

export { DEFAULT_META };
