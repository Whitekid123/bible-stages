import { hashString } from "@/lib/utils";

export type MemoryVerse = {
  id: string;
  reference: string;
  text: string;
  note: string;
};

/** Public-domain King James wording, short enough for a hall board. */
export const VERSES: MemoryVerse[] = [
  {
    id: "psalm-23-1",
    reference: "Psalm 23:1",
    text: "The Lord is my shepherd; I shall not want.",
    note: "Care, not shortage.",
  },
  {
    id: "john-3-16",
    reference: "John 3:16",
    text: "For God so loved the world, that he gave his only begotten Son.",
    note: "Love that gives.",
  },
  {
    id: "phil-4-13",
    reference: "Philippians 4:13",
    text: "I can do all things through Christ which strengtheneth me.",
    note: "Strength for the sitting.",
  },
  {
    id: "prov-3-5",
    reference: "Proverbs 3:5",
    text: "Trust in the Lord with all thine heart; and lean not unto thine own understanding.",
    note: "Trust before cleverness.",
  },
  {
    id: "psalm-119-105",
    reference: "Psalm 119:105",
    text: "Thy word is a lamp unto my feet, and a light unto my path.",
    note: "Scripture as a lamp.",
  },
  {
    id: "matt-5-14",
    reference: "Matthew 5:14",
    text: "Ye are the light of the world. A city that is set on an hill cannot be hid.",
    note: "Light that shows.",
  },
  {
    id: "josh-1-9",
    reference: "Joshua 1:9",
    text: "Be strong and of a good courage; be not afraid, neither be thou dismayed.",
    note: "Courage for the paper.",
  },
  {
    id: "isa-41-10",
    reference: "Isaiah 41:10",
    text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God.",
    note: "Presence, not panic.",
  },
  {
    id: "psalm-46-1",
    reference: "Psalm 46:1",
    text: "God is our refuge and strength, a very present help in trouble.",
    note: "Help that is near.",
  },
  {
    id: "rom-8-28",
    reference: "Romans 8:28",
    text: "And we know that all things work together for good to them that love God.",
    note: "Good, even in hard work.",
  },
  {
    id: "matt-11-28",
    reference: "Matthew 11:28",
    text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
    note: "Rest after labour.",
  },
  {
    id: "gen-1-1",
    reference: "Genesis 1:1",
    text: "In the beginning God created the heaven and the earth.",
    note: "The first line of the story.",
  },
  {
    id: "john-14-6",
    reference: "John 14:6",
    text: "Jesus saith unto him, I am the way, the truth, and the life.",
    note: "Way, truth, life.",
  },
  {
    id: "psalm-27-1",
    reference: "Psalm 27:1",
    text: "The Lord is my light and my salvation; whom shall I fear?",
    note: "Light before fear.",
  },
];

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function verseOfTheDay(date = new Date()): MemoryVerse {
  const index = hashString(`verse-${utcDayKey(date)}`) % VERSES.length;
  return VERSES[index]!;
}

export function verseWords(text: string) {
  return text.split(/\s+/).filter(Boolean);
}
