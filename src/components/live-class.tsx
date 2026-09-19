import { Link } from "@tanstack/react-router";
import { EyeOff, Signal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/app-store";
import { stageById } from "@/lib/bible/stages";
import type { SeatWatch } from "@/lib/bible/types";

function ageMs(iso: string) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return Number.POSITIVE_INFINITY;
  return Date.now() - t;
}

function seatStatus(seat: SeatWatch) {
  const stale = ageMs(seat.lastSeen) > 20_000;
  if (seat.hidden || stale) {
    return { label: "Left the app", tone: "danger" as const, live: false };
  }
  if (seat.inExam) return { label: "Writing", tone: "ok" as const, live: true };
  return { label: "In the hall", tone: "warn" as const, live: true };
}

export function LiveClass() {
  const seats = useAppStore((s) => s.presence).filter((row) => row.role === "student");
  const papers = useAppStore((s) => s.papers);
  const writing = papers.filter((p) => !p.submittedAt).length;
  const away = seats.filter((s) => seatStatus(s).label === "Left the app").length;

  return (
    <section className="rounded-xl border border-border bg-bg-elevated p-5 shadow-lift">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">Live class</p>
          <h2 className="mt-1 font-display text-2xl tracking-tight">Who is in the exam</h2>
          <p className="mt-1 text-sm text-muted">
            Students on other phones appear here. If someone leaves the app or switches away, it
            flags on this desk.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="ok">{seats.length} connected</Badge>
          <Badge variant="ok">{writing} writing</Badge>
          {away > 0 ? <Badge variant="danger">{away} left the app</Badge> : null}
        </div>
      </div>

      {seats.length === 0 ? (
        <p className="mt-5 text-sm text-muted">
          No student is connected yet. When they enter on their own phone with internet, they
          show here.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-border overflow-hidden rounded-lg border border-border">
          {seats.map((seat) => {
            const status = seatStatus(seat);
            const stage = seat.stageId ? stageById(seat.stageId) : null;
            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{seat.name}</p>
                    <p className="text-sm text-muted">
                      {seat.inExam
                        ? `Stage ${stage?.roman ?? ""} · ${stage?.name ?? "paper"} · ${seat.answersSaved} answers saved`
                        : "In the hall — not yet sitting"}
                    </p>
                  </div>
                  <Badge variant={status.tone}>
                    {status.live ? <Signal className="size-3" /> : <EyeOff className="size-3" />}
                    {status.label}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-subtle">
                  {seat.tabLeaves + seat.appLeaves > 0
                    ? `Left ${seat.tabLeaves + seat.appLeaves} time${seat.tabLeaves + seat.appLeaves === 1 ? "" : "s"}`
                    : "Clean so far"}
                  {seat.appLeaves > 0 ? ` · left the app ${seat.appLeaves}×` : ""}
                </p>
              </>
            );
            return (
              <li key={seat.name}>
                {seat.paperId ? (
                  <Link
                    to="/teacher/paper/$paperId"
                    params={{ paperId: seat.paperId }}
                    className="block px-4 py-3 transition-colors duration-150 hover:bg-bg"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="px-4 py-3">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
