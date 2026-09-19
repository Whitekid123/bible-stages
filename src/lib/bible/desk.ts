import type { Bookmark, NotebookItem, PracticeLog, StudentDesk } from "./types";
import { todayKey } from "./verses";
import { EMPTY_PARISH, type ParishDesk } from "@/lib/parish/content";

export const EMPTY_DESK: StudentDesk = {
  bookmarks: [],
  notebook: [],
  practiceLog: [],
  knownCount: 0,
  learningCount: 0,
  knownVerses: [],
  lastVisitDate: null,
  streak: 0,
  parish: { ...EMPTY_PARISH },
};

export function parishOf(desk: StudentDesk): ParishDesk {
  return { ...EMPTY_PARISH, ...desk.parish };
}

export function withParish(desk: StudentDesk, parish: ParishDesk): StudentDesk {
  return { ...desk, parish };
}

function nextDay(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + 1);
  return todayKey(dt);
}

export function applyStreak(desk: StudentDesk, today = todayKey()): StudentDesk {
  if (desk.lastVisitDate === today) return desk;
  const streak = desk.lastVisitDate && nextDay(desk.lastVisitDate) === today ? desk.streak + 1 : 1;
  return { ...desk, lastVisitDate: today, streak };
}

export function upsertNotebook(desk: StudentDesk, items: NotebookItem[]): StudentDesk {
  const map = new Map(desk.notebook.map((item) => [item.questionId, item]));
  for (const item of items) map.set(item.questionId, item);
  const notebook = [...map.values()]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 60);
  return { ...desk, notebook };
}

export function dropNotebook(desk: StudentDesk, questionId: string): StudentDesk {
  return { ...desk, notebook: desk.notebook.filter((item) => item.questionId !== questionId) };
}

export function pinBookmark(desk: StudentDesk, item: Bookmark): StudentDesk {
  const rest = desk.bookmarks.filter((b) => b.questionId !== item.questionId);
  return { ...desk, bookmarks: [item, ...rest].slice(0, 40) };
}

export function unpinBookmark(desk: StudentDesk, questionId: string): StudentDesk {
  return { ...desk, bookmarks: desk.bookmarks.filter((b) => b.questionId !== questionId) };
}

export function pushPractice(desk: StudentDesk, entry: PracticeLog): StudentDesk {
  return { ...desk, practiceLog: [entry, ...desk.practiceLog].slice(0, 30) };
}

export function markVerseKnown(desk: StudentDesk, verseId: string): StudentDesk {
  if (desk.knownVerses.includes(verseId)) return desk;
  return { ...desk, knownVerses: [verseId, ...desk.knownVerses].slice(0, 40) };
}
