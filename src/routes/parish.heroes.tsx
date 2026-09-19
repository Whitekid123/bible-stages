import { createFileRoute, Link } from "@tanstack/react-router";
import { StudentShell } from "@/components/student-shell";
import { useStudentGate } from "@/components/student-gate";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import { parishOf } from "@/lib/bible/desk";
import { STORIES } from "@/lib/parish/content";

export const Route = createFileRoute("/parish/heroes")({ component: HeroesPage });

function HeroesPage() {
  const session = useStudentGate();
  const parish = parishOf(useAppStore((s) => s.desk));
  if (!session) return null;

  return (
    <StudentShell wide>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">Hero seals</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Kept names</h1>
      <p className="mt-3 text-muted">Finish a story to keep its hero on this shelf.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {STORIES.map((story) => {
          const kept = parish.heroes.includes(story.hero);
          return (
            <div
              key={story.id}
              className={`rounded-xl p-5 shadow-lift ${
                kept ? "bg-accent text-accent-fg" : "bg-bg-elevated"
              }`}
            >
              <p className="text-xs tracking-[0.14em] uppercase opacity-70">{story.reference}</p>
              <p className="mt-2 font-display text-2xl">{story.hero}</p>
              <p className={`mt-1 text-sm ${kept ? "text-accent-fg/80" : "text-muted"}`}>
                {kept ? "Sealed on your shelf." : "Still in the nave."}
              </p>
              {!kept ? (
                <Button className="mt-3" size="sm" asChild>
                  <Link to="/parish/stories/$storyId" params={{ storyId: story.id }}>
                    Read {story.title}
                  </Link>
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </StudentShell>
  );
}
