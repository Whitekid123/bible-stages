import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_META } from "@/lib/bible/pack";
import {
  getScript,
  leaveHall,
  listHonourBoard,
  listMyScripts,
  listScripts,
  markScript,
  noteScript,
  pingHall,
  beatHall,
  saveScriptProgress,
  startScript,
  submitScript,
  updateHallSettings,
  verifyClassPassword,
  verifyTeacherPassword,
} from "@/lib/hall";
import {
  deleteCustomQuestion,
  downloadPack,
  importCustomQuestions,
  loadRevisionCards,
  loadStarterSet,
  saveCustomQuestion,
  scorePractice,
} from "@/lib/bank-api";
import {
  applyStreak,
  dropNotebook,
  EMPTY_DESK,
  markVerseKnown,
  pinBookmark,
  pushPractice,
  unpinBookmark,
  upsertNotebook,
} from "@/lib/bible/desk";
import type {
  BankMode,
  Bookmark,
  ExamSize,
  HallMeta,
  HonourRow,
  NotebookItem,
  Paper,
  Question,
  QuestionPack,
  RevisionCard,
  SeatWatch,
  Session,
  StageId,
  StudentDesk,
} from "@/lib/bible/types";

const OFFLINE =
  "No connection to the hall. Starting and handing in need the network so the teacher can receive the paper.";

type PracticeReview = {
  id: string;
  prompt: string;
  section: string;
  given: string;
  answer: string;
  ok: boolean;
};

type AppState = {
  hydrated: boolean;
  session: Session | null;
  examSize: ExamSize;
  papers: Paper[];
  myPapers: Paper[];
  draft: Paper | null;
  online: boolean | null;
  sending: boolean;
  pack: QuestionPack | null;
  packing: boolean;
  hallMeta: HallMeta;
  customQuestions: Question[];
  desk: StudentDesk;
  honour: { open: boolean; rows: HonourRow[] } | null;
  presence: SeatWatch[];
  setHydrated: () => void;
  ping: () => Promise<boolean>;
  resumeHall: () => Promise<void>;
  loginStudent: (name: string, password: string) => Promise<string | null>;
  loginTeacher: (password: string) => Promise<string | null>;
  logout: () => void;
  syncPack: () => Promise<string | null>;
  refreshPapers: () => Promise<string | null>;
  refreshMyPapers: () => Promise<string | null>;
  startPaper: (stageId: StageId) => Promise<{ paper?: Paper; error?: string }>;
  saveAnswer: (paperId: string, questionId: string, value: string) => void;
  recordTabLeave: (paperId: string) => void;
  recordAppLeave: () => void;
  beat: (hidden: boolean, appLeave?: boolean) => Promise<void>;
  flushProgress: (paperId: string) => Promise<void>;
  submitPaper: (paperId: string, timeUp?: boolean) => Promise<string | null>;
  setTeacherNotes: (paperId: string, notes: string) => void;
  markBlank: (paperId: string, questionId: string, mark: "correct" | "wrong" | "unset") => void;
  loadPaper: (paperId: string) => Promise<string | null>;
  setExamSize: (size: ExamSize) => Promise<string | null>;
  savePasswords: (classPassword: string, teacherPassword: string) => Promise<string | null>;
  saveHallOptions: (patch: {
    notice?: string;
    sittingOpen?: boolean;
    bankMode?: BankMode;
    practiceOpen?: boolean;
    releaseMarks?: boolean;
  }) => Promise<string | null>;
  saveQuestion: (input: {
    id?: string;
    stageId: StageId;
    section: "objective" | "blank";
    prompt: string;
    answer: string;
    distractors: string[];
    aliases: string[];
    reference?: string;
    published: boolean;
  }) => Promise<string | null>;
  removeQuestion: (id: string) => Promise<string | null>;
  importQuestions: (
    items: {
      stageId: StageId;
      section: "objective" | "blank";
      prompt: string;
      answer: string;
      distractors: string[];
      aliases: string[];
      reference?: string;
    }[],
  ) => Promise<{ error?: string; added?: number }>;
  addStarterSet: () => Promise<{ error?: string; added?: number }>;
  markPractice: (
    stageId: StageId,
    questionIds: string[],
    answers: Record<string, string>,
  ) => Promise<{ error?: string; score?: { correct: number; total: number; percent: number }; review?: PracticeReview[] }>;
  touchStreak: () => void;
  pinQuestion: (item: Bookmark) => void;
  unpinQuestion: (questionId: string) => void;
  rememberMisses: (items: NotebookItem[]) => void;
  forgetMiss: (questionId: string) => void;
  logPractice: (entry: {
    stageId: StageId;
    correct: number;
    total: number;
    percent: number;
  }) => void;
  bumpCard: (kind: "known" | "learning") => void;
  rememberVerse: (verseId: string) => void;
  fetchCards: (stageId: StageId, count?: number) => Promise<{ error?: string; cards?: RevisionCard[] }>;
  fetchHonour: () => Promise<string | null>;
};

async function guarded<T>(run: () => Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    return await run();
  } catch {
    return { ok: false, error: OFFLINE };
  }
}

function upsertPaper(papers: Paper[], paper: Paper) {
  const rest = papers.filter((p) => p.id !== paper.id);
  return [paper, ...rest];
}

function markOnline(error?: string) {
  if (!error) return { online: true as const };
  if (error === OFFLINE) return { online: false as const };
  return { online: true as const };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      session: null,
      examSize: 20,
      papers: [],
      myPapers: [],
      draft: null,
      online: null,
      sending: false,
      pack: null,
      packing: false,
      hallMeta: DEFAULT_META,
      customQuestions: [],
      desk: EMPTY_DESK,
      honour: null,
      presence: [],
      setHydrated: () => set({ hydrated: true }),
      ping: async () => {
        const res = await guarded(() => pingHall());
        const ok = "ok" in res && res.ok === true;
        set({ online: ok });
        return ok;
      },
      resumeHall: async () => {
        const { session, draft } = get();
        if (session) await get().syncPack();
        if (session?.role === "student") await get().refreshMyPapers();
        if (session?.role !== "student" || !draft || draft.submittedAt) return;
        if (draft.pendingSubmit) {
          await get().submitPaper(draft.id, draft.timeUp);
          return;
        }
        await get().flushProgress(draft.id);
      },
      loginStudent: async (name, password) => {
        const trimmed = name.trim();
        if (trimmed.length < 2) return "Enter the student's full name.";
        const res = await guarded(() => verifyClassPassword({ data: { password } }));
        if (!res.ok) {
          set(markOnline(res.error));
          return res.error;
        }
        set({
          session: { role: "student", name: trimmed, password },
          examSize: res.examSize,
          hallMeta: res.meta ?? get().hallMeta,
          online: true,
          desk: applyStreak(get().desk ?? EMPTY_DESK),
        });
        await get().syncPack();
        await get().refreshMyPapers();
        await get().beat(false);
        return null;
      },
      loginTeacher: async (password) => {
        const res = await guarded(() => verifyTeacherPassword({ data: { password } }));
        if (!res.ok) {
          set(markOnline(res.error));
          return res.error;
        }
        set({
          session: { role: "teacher", name: "Teacher", password },
          examSize: res.examSize,
          hallMeta: res.meta ?? get().hallMeta,
          online: true,
        });
        await get().syncPack();
        const listed = await guarded(() => listScripts({ data: { password } }));
        if (listed.ok) {
          set({
            papers: listed.papers,
            presence: listed.presence ?? [],
            examSize: listed.examSize,
            hallMeta: listed.meta ?? get().hallMeta,
          });
        }
        return null;
      },
      logout: () => {
        const session = get().session;
        if (session?.role === "student") {
          void leaveHall({ data: { password: session.password, candidate: session.name } });
        }
        set({
          session: null,
          draft: null,
          papers: [],
          myPapers: [],
          pack: null,
          customQuestions: [],
          honour: null,
          presence: [],
        });
      },
      syncPack: async () => {
        const session = get().session;
        if (!session) return "Sign in first.";
        set({ packing: true });
        const res = await guarded(() =>
          downloadPack({ data: { password: session.password, role: session.role } }),
        );
        set({ packing: false });
        if (!res.ok) {
          set(markOnline(res.error));
          return res.error;
        }
        const pack: QuestionPack = {
          version: res.meta.packVersion,
          downloadedAt: res.downloadedAt,
          questions: res.questions,
        };
        set({
          pack,
          hallMeta: res.meta,
          examSize: res.meta.examSize,
          customQuestions: session.role === "teacher" ? res.questions : [],
          online: true,
        });
        return null;
      },
      refreshPapers: async () => {
        const session = get().session;
        if (session?.role !== "teacher") return "Teacher only.";
        const res = await guarded(() => listScripts({ data: { password: session.password } }));
        if (!res.ok) {
          set(markOnline(res.error));
          return res.error;
        }
        set({
          papers: res.papers,
          presence: res.presence ?? [],
          examSize: res.examSize,
          hallMeta: res.meta ?? get().hallMeta,
          online: true,
        });
        return null;
      },
      refreshMyPapers: async () => {
        const session = get().session;
        if (session?.role !== "student") return "Student only.";
        const res = await guarded(() =>
          listMyScripts({ data: { password: session.password, candidate: session.name } }),
        );
        if (!res.ok) {
          set(markOnline(res.error));
          return res.error;
        }
        set({ myPapers: res.papers, hallMeta: res.meta ?? get().hallMeta, online: true });
        return null;
      },
      startPaper: async (stageId) => {
        const session = get().session;
        if (session?.role !== "student") return { error: "Enter as a student first." };
        const open = get().draft;
        if (open && !open.submittedAt && open.pendingSubmit) {
          return {
            error: "Your last paper is still being sent to the teacher. Stay on that exam until it goes through.",
          };
        }
        const res = await guarded(() =>
          startScript({
            data: { password: session.password, candidate: session.name, stageId },
          }),
        );
        if (!res.ok) {
          set(markOnline(res.error));
          return { error: res.error };
        }
        set({ draft: res.paper, papers: upsertPaper(get().papers, res.paper), online: true });
        await get().beat(false);
        return { paper: res.paper };
      },
      saveAnswer: (paperId, questionId, value) => {
        const current = get().draft;
        if (current?.id === paperId && current.pendingSubmit) return;
        const patch = (p: Paper) =>
          p.id === paperId ? { ...p, answers: { ...p.answers, [questionId]: value } } : p;
        set({
          draft: get().draft ? patch(get().draft!) : get().draft,
          papers: get().papers.map(patch),
        });
      },
      recordTabLeave: (paperId) => {
        const current = get().draft;
        if (current?.id === paperId && current.pendingSubmit) return;
        const patch = (p: Paper) => (p.id === paperId ? { ...p, tabLeaves: p.tabLeaves + 1 } : p);
        set({
          draft: get().draft ? patch(get().draft!) : get().draft,
          papers: get().papers.map(patch),
        });
      },
      recordAppLeave: () => {
        const paper = get().draft;
        if (!paper || paper.submittedAt || paper.pendingSubmit) {
          void get().beat(true, true);
          return;
        }
        const now = Date.now();
        const last = Number((paper as Paper & { _leaveAt?: number })._leaveAt ?? 0);
        if (now - last < 1500) {
          void get().beat(true, true);
          return;
        }
        const patch = (p: Paper) =>
          p.id === paper.id
            ? { ...p, appLeaves: (p.appLeaves ?? 0) + 1, hidden: true, lastSeen: new Date().toISOString() }
            : p;
        set({
          draft: get().draft ? patch(get().draft!) : get().draft,
          papers: get().papers.map(patch),
        });
        void get().beat(true, true);
      },
      beat: async (hidden, appLeave = false) => {
        const session = get().session;
        if (session?.role !== "student") return;
        const paper = get().draft && !get().draft?.submittedAt ? get().draft : null;
        const answersSaved = paper
          ? Object.values(paper.answers).filter((v) => v?.trim()).length
          : 0;
        const res = await guarded(() =>
          beatHall({
            data: {
              password: session.password,
              candidate: session.name,
              paperId: paper?.id,
              stageId: paper?.stageId,
              hidden,
              inExam: Boolean(paper),
              tabLeaves: paper?.tabLeaves ?? 0,
              answersSaved,
              appLeave,
            },
          }),
        );
        if (!res.ok) {
          set(markOnline(res.error));
          return;
        }
        set({ online: true });
      },
      flushProgress: async (paperId) => {
        const session = get().session;
        const paper = get().draft?.id === paperId ? get().draft : get().papers.find((p) => p.id === paperId);
        if (session?.role !== "student" || !paper || paper.submittedAt || paper.pendingSubmit) return;
        const res = await guarded(() =>
          saveScriptProgress({
            data: {
              password: session.password,
              paperId,
              answers: paper.answers,
              tabLeaves: paper.tabLeaves,
            },
          }),
        );
        if (!res.ok) {
          set(markOnline(res.error));
          return;
        }
        set({ online: true });
      },
      submitPaper: async (paperId, timeUp = false) => {
        const session = get().session;
        const paper = get().draft?.id === paperId ? get().draft : get().papers.find((p) => p.id === paperId);
        if (session?.role !== "student" || !paper) return "That paper is not on this device.";
        if (paper.submittedAt) return null;
        if (get().sending) return null;
        const queued: Paper = {
          ...paper,
          pendingSubmit: true,
          timeUp: timeUp || paper.timeUp,
        };
        set({
          draft: queued,
          papers: upsertPaper(get().papers, queued),
          sending: true,
        });
        const res = await guarded(() =>
          submitScript({
            data: {
              password: session.password,
              paperId,
              answers: queued.answers,
              tabLeaves: queued.tabLeaves,
              timeUp: queued.timeUp,
            },
          }),
        );
        if (!res.ok) {
          set({ sending: false, ...markOnline(res.error) });
          return res.error;
        }
        const received: Paper = { ...res.paper, pendingSubmit: false };
        set({
          draft: received,
          papers: upsertPaper(get().papers, received),
          myPapers: upsertPaper(get().myPapers, received),
          online: true,
          sending: false,
        });
        return null;
      },
      setTeacherNotes: (paperId, notes) => {
        const session = get().session;
        const patch = (p: Paper) => (p.id === paperId ? { ...p, teacherNotes: notes } : p);
        set({ papers: get().papers.map(patch) });
        if (session?.role === "teacher") {
          void noteScript({ data: { password: session.password, paperId, notes } });
        }
      },
      markBlank: (paperId, questionId, mark) => {
        const session = get().session;
        const patch = (p: Paper) =>
          p.id === paperId ? { ...p, blankMarks: { ...p.blankMarks, [questionId]: mark } } : p;
        set({ papers: get().papers.map(patch) });
        if (session?.role === "teacher") {
          void markScript({ data: { password: session.password, paperId, questionId, mark } }).then(
            (res) => {
              if (res.ok) set({ papers: upsertPaper(get().papers, res.paper) });
            },
          );
        }
      },
      loadPaper: async (paperId) => {
        const session = get().session;
        if (session?.role !== "teacher") return "Teacher only.";
        const res = await guarded(() => getScript({ data: { password: session.password, paperId } }));
        if (!res.ok) return res.error;
        set({ papers: upsertPaper(get().papers, res.paper), online: true });
        return null;
      },
      setExamSize: async (size) => {
        const session = get().session;
        if (session?.role !== "teacher") return "Teacher only.";
        const res = await guarded(() =>
          updateHallSettings({ data: { password: session.password, examSize: size } }),
        );
        if (!res.ok) {
          set(markOnline(res.error));
          return res.error;
        }
        set({ examSize: res.examSize, hallMeta: res.meta ?? get().hallMeta, online: true });
        return null;
      },
      savePasswords: async (classPassword, teacherPassword) => {
        const session = get().session;
        if (session?.role !== "teacher") return "Teacher only.";
        const res = await guarded(() =>
          updateHallSettings({
            data: { password: session.password, classPassword, teacherPassword },
          }),
        );
        if (!res.ok) {
          set(markOnline(res.error));
          return res.error;
        }
        set({
          session: { ...session, password: teacherPassword },
          hallMeta: res.meta ?? get().hallMeta,
          online: true,
        });
        return null;
      },
      saveHallOptions: async (patch) => {
        const session = get().session;
        if (session?.role !== "teacher") return "Teacher only.";
        const res = await guarded(() =>
          updateHallSettings({ data: { password: session.password, ...patch } }),
        );
        if (!res.ok) {
          set(markOnline(res.error));
          return res.error;
        }
        set({ examSize: res.examSize, hallMeta: res.meta ?? get().hallMeta, online: true });
        return null;
      },
      saveQuestion: async (input) => {
        const session = get().session;
        if (session?.role !== "teacher") return "Teacher only.";
        const res = await guarded(() =>
          saveCustomQuestion({
            data: {
              password: session.password,
              id: input.id,
              stageId: input.stageId,
              section: input.section,
              prompt: input.prompt,
              answer: input.answer,
              distractors: input.distractors,
              aliases: input.aliases,
              reference: input.reference,
              published: input.published,
            },
          }),
        );
        if (!res.ok) {
          set(markOnline(res.error));
          return res.error;
        }
        set({
          customQuestions: res.questions,
          pack: {
            version: res.meta.packVersion,
            downloadedAt: new Date().toISOString(),
            questions: res.questions,
          },
          hallMeta: res.meta,
          online: true,
        });
        return null;
      },
      removeQuestion: async (id) => {
        const session = get().session;
        if (session?.role !== "teacher") return "Teacher only.";
        const res = await guarded(() =>
          deleteCustomQuestion({ data: { password: session.password, id } }),
        );
        if (!res.ok) {
          set(markOnline(res.error));
          return res.error;
        }
        set({
          customQuestions: res.questions,
          pack: {
            version: res.meta.packVersion,
            downloadedAt: new Date().toISOString(),
            questions: res.questions,
          },
          hallMeta: res.meta,
          online: true,
        });
        return null;
      },
      importQuestions: async (items) => {
        const session = get().session;
        if (session?.role !== "teacher") return { error: "Teacher only." };
        const res = await guarded(() =>
          importCustomQuestions({ data: { password: session.password, items } }),
        );
        if (!res.ok) {
          set(markOnline(res.error));
          return { error: res.error };
        }
        set({
          customQuestions: res.questions,
          pack: {
            version: res.meta.packVersion,
            downloadedAt: new Date().toISOString(),
            questions: res.questions,
          },
          hallMeta: res.meta,
          online: true,
        });
        return { added: res.added };
      },
      addStarterSet: async () => {
        const session = get().session;
        if (session?.role !== "teacher") return { error: "Teacher only." };
        const res = await guarded(() => loadStarterSet({ data: { password: session.password } }));
        if (!res.ok) {
          set(markOnline(res.error));
          return { error: res.error };
        }
        set({
          customQuestions: res.questions,
          pack: {
            version: res.meta.packVersion,
            downloadedAt: new Date().toISOString(),
            questions: res.questions,
          },
          hallMeta: res.meta,
          online: true,
        });
        return { added: res.added };
      },
      markPractice: async (stageId, questionIds, answers) => {
        const session = get().session;
        if (session?.role !== "student") return { error: "Enter as a student first." };
        const res = await guarded(() =>
          scorePractice({
            data: { password: session.password, stageId, questionIds, answers },
          }),
        );
        if (!res.ok) {
          set(markOnline(res.error));
          return { error: res.error };
        }
        const misses = (res.review ?? [])
          .filter((item) => !item.ok)
          .map((item) => ({
            questionId: item.id,
            stageId,
            prompt: item.prompt,
            given: item.given,
            answer: item.answer,
            at: new Date().toISOString(),
          }));
        set({
          online: true,
          desk: pushPractice(upsertNotebook(get().desk, misses), {
            id: `pr-${Date.now().toString(36)}`,
            stageId,
            correct: res.score?.correct ?? 0,
            total: res.score?.total ?? 0,
            percent: res.score?.percent ?? 0,
            at: new Date().toISOString(),
          }),
        });
        return { score: res.score, review: res.review };
      },
      touchStreak: () => set({ desk: applyStreak(get().desk) }),
      pinQuestion: (item) => set({ desk: pinBookmark(get().desk, item) }),
      unpinQuestion: (questionId) => set({ desk: unpinBookmark(get().desk, questionId) }),
      rememberMisses: (items) => set({ desk: upsertNotebook(get().desk, items) }),
      forgetMiss: (questionId) => set({ desk: dropNotebook(get().desk, questionId) }),
      logPractice: (entry) =>
        set({
          desk: pushPractice(get().desk, {
            id: `pr-${Date.now().toString(36)}`,
            ...entry,
            at: new Date().toISOString(),
          }),
        }),
      bumpCard: (kind) =>
        set({
          desk: {
            ...get().desk,
            knownCount: get().desk.knownCount + (kind === "known" ? 1 : 0),
            learningCount: get().desk.learningCount + (kind === "learning" ? 1 : 0),
          },
        }),
      rememberVerse: (verseId) => set({ desk: markVerseKnown(get().desk, verseId) }),
      fetchCards: async (stageId, count = 12) => {
        const session = get().session;
        if (session?.role !== "student") return { error: "Enter as a student first." };
        const res = await guarded(() =>
          loadRevisionCards({ data: { password: session.password, stageId, count } }),
        );
        if (!res.ok) {
          set(markOnline(res.error));
          return { error: res.error };
        }
        set({ online: true });
        return { cards: res.cards };
      },
      fetchHonour: async () => {
        const session = get().session;
        if (session?.role !== "student") return "Enter as a student first.";
        const res = await guarded(() => listHonourBoard({ data: { password: session.password } }));
        if (!res.ok) {
          set(markOnline(res.error));
          return res.error;
        }
        set({ honour: { open: res.open, rows: res.rows }, hallMeta: res.meta, online: true });
        return null;
      },
    }),
    {
      name: "bible-stages-v2",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        session: s.session,
        examSize: s.examSize,
        draft: s.draft,
        pack: s.pack,
        hallMeta: s.hallMeta,
        customQuestions: s.session?.role === "teacher" ? s.customQuestions : [],
        myPapers: s.myPapers,
        desk: s.desk,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...saved,
          desk: { ...EMPTY_DESK, ...saved.desk },
        };
      },
    },
  ),
);
