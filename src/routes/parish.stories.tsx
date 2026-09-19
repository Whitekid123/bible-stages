import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { StudentShell } from "@/components/student-shell";
import { useStudentGate } from "@/components/student-gate";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/app-store";
import { parishOf } from "@/lib/bible/desk";
import { STORIES } from "@/lib/parish/content";

export const Route = createFileRoute("/parish/stories")({ component: StoriesIndex });

function StoriesIndex() {
  const session = useStudentGate();
  const parish = parishOf(useAppStore((s) => s.desk));
  if (!session) return null;

  return (
    <StudentShell wide>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">Story nave</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Walk the stories</h1>
      <p className="mt-3 max-w-xl text-muted">
        Tap a door. Each story is short enough for a restless class, long enough to remember.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {STORIES.map((story) => {
          const read = parish.storiesRead.includes(story.id);
          return (
            <Link
              key={story.id}
              to="/parish/stories/$storyId"
              params={{ storyId: story.id }}
              className="rounded-xl bg-bg-elevated p-5 shadow-lift"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs tracking-[0.14em] text-muted uppercase">{story.reference}</p>
                {read ? <Badge variant="ok">Read</Badge> : null}
              </div>
              <p className="mt-2 font-display text-2xl tracking-tight">{story.title}</p>
              <p className="mt-1 text-sm text-muted">{story.blurb}</p>
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-medium">
                Open
                <ArrowRight className="size-4" />
              </p>
            </Link>
          );
        })}
      </div>
    </StudentShell>
  );
}
