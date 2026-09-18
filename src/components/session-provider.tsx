import { useEffect, type ReactNode } from "react";
import { useAppStore } from "@/lib/app-store";
import { registerServiceWorker } from "@/lib/pwa";

export function SessionProvider({ children }: { children: ReactNode }) {
  const setHydrated = useAppStore((s) => s.setHydrated);
  const ping = useAppStore((s) => s.ping);
  const resumeHall = useAppStore((s) => s.resumeHall);
  const pending = useAppStore((s) => Boolean(s.draft?.pendingSubmit && !s.draft.submittedAt));
  const touchStreak = useAppStore((s) => s.touchStreak);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) {
      setHydrated();
      const session = useAppStore.getState().session;
      if (session?.role === "student") touchStreak();
      return;
    }
    const unsub = useAppStore.persist.onFinishHydration(() => {
      setHydrated();
      const session = useAppStore.getState().session;
      if (session?.role === "student") touchStreak();
    });
    useAppStore.persist.rehydrate();
    return unsub;
  }, [setHydrated, touchStreak]);

  useEffect(() => {
    const connect = () => {
      void ping().then((ok) => {
        if (ok) void resumeHall();
      });
    };
    connect();
    const onOnline = () => connect();
    const onOffline = () => useAppStore.setState({ online: false });
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [ping, resumeHall]);

  useEffect(() => {
    if (!pending) return;
    const tick = window.setInterval(() => void resumeHall(), 4000);
    return () => window.clearInterval(tick);
  }, [pending, resumeHall]);

  return children;
}
