import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { BarChart3, BookMarked, ClipboardList, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mark } from "@/components/mark";
import { useAppStore } from "@/lib/app-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/teacher")({ component: TeacherLayout });

const LINKS = [
  { to: "/teacher", label: "Scripts", icon: ClipboardList, exact: true },
  { to: "/teacher/bank", label: "Bank", icon: BookMarked, exact: false },
  { to: "/teacher/results", label: "Results", icon: BarChart3, exact: false },
] as const;

function TeacherLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const session = useAppStore((s) => s.session);
  const hydrated = useAppStore((s) => s.hydrated);
  const logout = useAppStore((s) => s.logout);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) navigate({ to: "/" });
    if (session?.role === "student") navigate({ to: "/hall" });
  }, [hydrated, session, navigate]);

  if (session?.role !== "teacher") return null;

  return (
    <div className="app-with-tabs min-h-dvh">
      <header className="nave-panel app-status print:hidden text-accent-fg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <Mark className="size-8" />
            <div>
              <p className="font-display text-lg leading-none">Teacher desk</p>
              <p className="text-sm text-accent-fg/70">Bank, scripts, class login</p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => {
              const active = link.exact ? pathname === link.to : pathname.startsWith(link.to);
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-150",
                    active
                      ? "bg-accent-fg/15 text-accent-fg"
                      : "text-accent-fg/70 hover:bg-accent-fg/10 hover:text-accent-fg",
                  )}
                >
                  <Icon className="size-4" />
                  {link.label}
                </Link>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              className="text-accent-fg hover:bg-accent-fg/10 hover:text-accent-fg"
              onClick={logout}
            >
              <LogOut className="size-4" />
              Leave
            </Button>
          </nav>
          <Button
            variant="ghost"
            size="sm"
            className="text-accent-fg hover:bg-accent-fg/10 hover:text-accent-fg lg:hidden"
            onClick={logout}
          >
            <LogOut className="size-4" />
            Leave
          </Button>
        </div>
      </header>
      <Outlet />
      <nav className="app-tabbar print-hidden lg:hidden">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const active = link.exact ? pathname === link.to : pathname.startsWith(link.to);
          return (
            <Link key={link.to} to={link.to} className={cn("app-tab", active && "is-active")}>
              <Icon className="size-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
