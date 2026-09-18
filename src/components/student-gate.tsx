import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAppStore } from "@/lib/app-store";

export function useStudentGate() {
  const navigate = useNavigate();
  const session = useAppStore((s) => s.session);
  const hydrated = useAppStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) navigate({ to: "/" });
    if (session?.role === "teacher") navigate({ to: "/teacher" });
  }, [hydrated, session, navigate]);

  return session?.role === "student" ? session : null;
}
