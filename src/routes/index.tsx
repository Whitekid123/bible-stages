import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mark } from "@/components/mark";
import { LiveLine } from "@/components/live-line";
import { NaveMotif } from "@/components/nave-motif";
import { InstallApp } from "@/components/install-app";
import { useAppStore } from "@/lib/app-store";
import { STAGES } from "@/lib/bible/stages";
import { verseOfTheDay } from "@/lib/bible/verses";

export const Route = createFileRoute("/")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const session = useAppStore((s) => s.session);
  const loginStudent = useAppStore((s) => s.loginStudent);
  const loginTeacher = useAppStore((s) => s.loginTeacher);
  const [mode, setMode] = useState<"student" | "teacher">("student");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const verse = verseOfTheDay();

  useEffect(() => {
    if (session?.role === "student") navigate({ to: "/hall" });
    if (session?.role === "teacher") navigate({ to: "/teacher" });
  }, [session, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result =
      mode === "student" ? await loginStudent(name, password) : await loginTeacher(password);
    setBusy(false);
    if (result) {
      setError(result);
      return;
    }
    navigate({ to: mode === "student" ? "/hall" : "/teacher" });
  }

  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-2">
      <section className="nave-panel app-status relative overflow-hidden px-6 py-10 text-accent-fg sm:px-10 lg:flex lg:flex-col lg:justify-between lg:py-14">
        <NaveMotif className="pointer-events-none absolute -right-8 top-8 w-48 opacity-80 lg:w-72" />
        <div className="relative max-w-lg">
          <div className="flex items-center gap-3">
            <Mark />
            <p className="text-sm font-medium tracking-[0.18em] uppercase text-accent-fg/70">
              Classroom app
            </p>
          </div>
          <h1 className="mt-8 font-display text-[clamp(3rem,8vw,5.5rem)] leading-[0.92] tracking-tight">
            Bible
            <br />
            Stages
          </h1>
          <p className="mt-6 max-w-md text-lg text-accent-fg/80">
            Install it on the phone. Lecturers add questions; every student downloads the pack on
            entry — even if they sit later.
          </p>
        </div>
        <div className="relative mt-10 max-w-lg lg:mt-0">
          <p className="text-xs font-medium tracking-[0.16em] uppercase text-accent-fg/60">
            Verse of the day · {verse.reference}
          </p>
          <p className="mt-3 font-display text-2xl italic leading-snug">{verse.text}</p>
          <ul className="mt-8 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
            {STAGES.map((stage) => (
              <li
                key={stage.id}
                className="rounded-md bg-accent-fg/10 px-3 py-2 text-accent-fg/90"
              >
                <span className="font-display">{stage.roman}</span>
                <span className="mt-1 block text-xs text-accent-fg/65">{stage.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex items-center px-6 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md space-y-5">
          <div className="rounded-xl bg-bg-elevated p-6 shadow-lift sm:p-8">
            <div className="mb-6 flex rounded-lg bg-bg-subtle p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("student");
                  setError(null);
                }}
                className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  mode === "student" ? "bg-bg-elevated text-fg shadow-soft" : "text-muted"
                }`}
              >
                <BookOpen className="size-4" />
                Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("teacher");
                  setError(null);
                }}
                className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  mode === "teacher" ? "bg-bg-elevated text-fg shadow-soft" : "text-muted"
                }`}
              >
                <KeyRound className="size-4" />
                Teacher
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "student" ? (
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    placeholder="As it should appear on the paper"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="password">
                  {mode === "student" ? "Class password" : "Teacher password"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <Button type="submit" className="w-full" size="lg" disabled={busy}>
                {busy
                  ? mode === "student"
                    ? "Packing questions onto this device…"
                    : "Opening the desk…"
                  : mode === "student"
                    ? "Enter the hall"
                    : "Open the desk"}
              </Button>
              <LiveLine />
            </form>

            <div className="mt-6 rounded-lg border border-border bg-bg px-4 py-3 text-sm text-muted">
              <p className="font-medium text-fg">Preview login</p>
              <p className="mt-1">
                Class password <span className="font-medium text-fg">class</span>
                {" · "}
                Teacher password <span className="font-medium text-fg">teacher</span>
              </p>
              <p className="mt-1">Change these later at the teacher desk.</p>
            </div>
          </div>
          <InstallApp />
        </div>
      </section>
    </main>
  );
}
