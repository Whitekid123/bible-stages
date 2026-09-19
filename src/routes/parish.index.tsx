import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Church,
  Cross,
  Fish,
  Handshake,
  Music,
  Sparkles,
  Swords,
} from "lucide-react";
import { StudentShell } from "@/components/student-shell";
import { useStudentGate } from "@/components/student-gate";
import { useAppStore } from "@/lib/app-store";
import { parishOf } from "@/lib/bible/desk";
import { STORIES } from "@/lib/parish/content";

export const Route = createFileRoute("/parish/")({ component: ParishHub });

const GAMES = [
  {
    to: "/parish/stories",
    title: "Story nave",
    copy: "Walk the old stories page by page. Hear them read aloud.",
    icon: BookOpen,
  },
  {
    to: "/parish/who",
    title: "Who am I?",
    copy: "Bible people in riddles. Score a streak of names.",
    icon: Sparkles,
  },
  {
    to: "/parish/match",
    title: "Pair the signs",
    copy: "Ark with Noah. Sling with David. Train the memory.",
    icon: Handshake,
  },
  {
    to: "/parish/race",
    title: "Verse race",
    copy: "Ten quick church questions. Beat your best.",
    icon: Swords,
  },
  {
    to: "/parish/sunday",
    title: "Sunday trail",
    copy: "Came, sang, verse, kindness — tick the day.",
    icon: Church,
  },
  {
    to: "/parish/heroes",
    title: "Hero seals",
    copy: "Finish a story, keep the hero.",
    icon: Cross,
  },
  {
    to: "/parish/prayer",
    title: "Lamp of prayer",
    copy: "Write a short prayer. Keep it on this phone.",
    icon: Fish,
  },
  {
    to: "/parish/choir",
    title: "Choir loft",
    copy: "Follow the hymn line by line.",
    icon: Music,
  },
] as const;

function ParishHub() {
  const session = useStudentGate();
  const desk = useAppStore((s) => s.desk);
  const parish = parishOf(desk);

  if (!session) return null;

  return (
    <StudentShell wide>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">Kids court</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Parish play</h1>
      <p className="mt-3 max-w-xl text-muted">
        Stories, games, hymns, and a Sunday trail — church things that keep hands busy after the
        paper is in.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Stars" value={String(parish.stars)} />
        <Stat label="Stories read" value={`${parish.storiesRead.length}/${STORIES.length}`} />
        <Stat label="Heroes kept" value={String(parish.heroes.length)} />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {GAMES.map((game) => {
          const Icon = game.icon;
          return (
            <Link
              key={game.to}
              to={game.to}
              className="group rounded-xl bg-bg-elevated p-5 shadow-lift transition-transform duration-150 hover:-translate-y-0.5"
            >
              <Icon className="size-5 text-accent" />
              <p className="mt-3 font-display text-2xl tracking-tight">{game.title}</p>
              <p className="mt-1 text-sm text-muted">{game.copy}</p>
            </Link>
          );
        })}
      </div>
    </StudentShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bg-elevated px-4 py-3 shadow-lift">
      <p className="text-xs tracking-[0.14em] text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl">{value}</p>
    </div>
  );
}
