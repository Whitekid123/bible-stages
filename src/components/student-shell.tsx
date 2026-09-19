import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  BookOpen,
  Church,
  ClipboardCheck,
  Layers,
  LayoutGrid,
  LogOut,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Mark } from "@/components/mark";
import { useAppStore } from "@/lib/app-store";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/hall", label: "Hall", icon: LayoutGrid },
  { to: "/parish", label: "Parish", icon: Church },
  { to: "/cards", label: "Cards", icon: Layers },
  { to: "/verse", label: "Verse", icon: BookOpen },
  { to: "/progress", label: "Me", icon: ClipboardCheck },
  { to: "/board", label: "Board", icon: Trophy },
] as const;

export function StudentShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const session = useAppStore((s) => s.session);
  const logout = useAppStore((s) => s.logout);
  const name = session?.role === "student" ? session.name : "Student";

  return (
    <div className="app-with-tabs min-h-dvh">
      <header className="nave-panel app-status print-hidden text-accent-fg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link to="/hall" className="flex items-center gap-3">
            <Mark className="size-8" />
            <div>
              <p className="font-display text-lg leading-none">Bible Stages</p>
              <p className="text-sm text-accent-fg/70">{name}</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => {
              const Icon = link.icon;
              const active = isActive(pathname, link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors duration-150",
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
              className="shrink-0 text-accent-fg hover:bg-accent-fg/10 hover:text-accent-fg"
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
      <div className={cn("mx-auto px-5 py-8", wide ? "max-w-6xl" : "max-w-3xl")}>{children}</div>
      <nav className="app-tabbar print-hidden lg:hidden">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const active = isActive(pathname, link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn("app-tab", active && "is-active")}
            >
              <Icon className="size-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function isActive(pathname: string, to: string) {
  if (to === "/hall") return pathname === "/hall";
  return pathname === to || pathname.startsWith(`${to}/`);
}
