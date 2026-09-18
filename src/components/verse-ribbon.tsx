import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { verseOfTheDay } from "@/lib/bible/verses";

export function VerseRibbon({ compact = false }: { compact?: boolean }) {
  const verse = verseOfTheDay();

  if (compact) {
    return (
      <p className="text-sm text-accent-fg/80">
        <span className="font-medium text-accent-fg">{verse.reference}</span>
        {" · "}
        {verse.text}
      </p>
    );
  }

  return (
    <Link
      to="/verse"
      className="block rounded-xl bg-accent p-5 text-accent-fg shadow-lift transition-transform duration-150 hover:-translate-y-0.5"
    >
      <p className="flex items-center gap-2 text-xs font-medium tracking-[0.16em] uppercase text-accent-fg/70">
        <BookOpen className="size-3.5" />
        Verse of the day
      </p>
      <p className="mt-3 font-display text-xl leading-snug italic sm:text-2xl">{verse.text}</p>
      <p className="mt-3 text-sm text-accent-fg/75">
        {verse.reference} · {verse.note} · Open the memory trainer
      </p>
    </Link>
  );
}
