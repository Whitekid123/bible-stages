import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StudentShell } from "@/components/student-shell";
import { SpeakButton } from "@/components/speak-button";
import { useStudentGate } from "@/components/student-gate";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import { parishOf } from "@/lib/bible/desk";
import { storyById } from "@/lib/parish/content";

export const Route = createFileRoute("/parish/stories/$storyId")({ component: StoryReader });

function StoryReader() {
  const session = useStudentGate();
  const { storyId } = Route.useParams();
  const navigate = useNavigate();
  const story = storyById(storyId);
  const patchParish = useAppStore((s) => s.patchParish);
  const parish = parishOf(useAppStore((s) => s.desk));
  const [page, setPage] = useState(0);

  if (!session) return null;
  if (!story) {
    return (
      <StudentShell>
        <p>That story is not in this nave.</p>
        <Button className="mt-4" asChild>
          <Link to="/parish/stories">Back</Link>
        </Button>
      </StudentShell>
    );
  }

  const beat = story.beats[page];
  const last = page === story.beats.length - 1;
  const already = parish.storiesRead.includes(story.id);

  function finish() {
    patchParish((p) => {
      const storiesRead = already ? p.storiesRead : [...p.storiesRead, story!.id];
      const heroes = p.heroes.includes(story!.hero) ? p.heroes : [...p.heroes, story!.hero];
      return {
        ...p,
        storiesRead,
        heroes,
        stars: p.stars + (already ? 0 : 3),
      };
    });
    navigate({ to: "/parish/heroes" });
  }

  return (
    <StudentShell>
      <p className="text-sm font-medium tracking-[0.16em] text-muted uppercase">{story.reference}</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{story.title}</h1>
      <p className="mt-2 text-sm text-muted">
        Page {page + 1} of {story.beats.length}
      </p>

      <article className="mt-8 rounded-xl bg-accent p-6 text-accent-fg shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-3xl tracking-tight">{beat.title}</h2>
          <SpeakButton text={`${beat.title}. ${beat.body}`} label="Hear" />
        </div>
        <p className="mt-4 text-lg leading-relaxed text-accent-fg/90">{beat.body}</p>
      </article>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="outline" disabled={page === 0} onClick={() => setPage((n) => n - 1)}>
          <ChevronLeft className="size-4" />
          Back
        </Button>
        {last ? (
          <Button onClick={finish}>{already ? "Read again" : "Keep this hero"}</Button>
        ) : (
          <Button onClick={() => setPage((n) => n + 1)}>
            Next
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </StudentShell>
  );
}
