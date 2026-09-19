import { useEffect, type ReactNode } from "react";
import { useAppStore } from "@/lib/app-store";
import { registerServiceWorker } from "@/lib/pwa";

declare global {
  interface Window {
    __bibleStagesAppHidden?: () => void;
    __bibleStagesAppShown?: () => void;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const setHydrated = useAppStore((s) => s.setHydrated);
  const ping = useAppStore((s) => s.ping);
  const resumeHall = useAppStore((s) => s.resumeHall);
  const pending = useAppStore((s) => Boolean(s.draft?.pendingSubmit && !s.draft.submittedAt));
  const touchStreak = useAppStore((s) => s.touchStreak);
  const session = useAppStore((s) => s.session);
  const beat = useAppStore((s) => s.beat);
  const recordAppLeave = useAppStore((s) => s.recordAppLeave);
  const recordTabLeave = useAppStore((s) => s.recordTabLeave);
  const flushProgress = useAppStore((s) => s.flushProgress);
  const draft = useAppStore((s) => s.draft);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) {
      setHydrated();
      const current = useAppStore.getState().session;
      if (current?.role === "student") touchStreak();
      return;
    }
    const unsub = useAppStore.persist.onFinishHydration(() => {
      setHydrated();
      const current = useAppStore.getState().session;
      if (current?.role === "student") touchStreak();
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

  useEffect(() => {
    const hide = () => {
      const paper = useAppStore.getState().draft;
      if (paper && !paper.submittedAt && !paper.pendingSubmit) {
        recordTabLeave(paper.id);
        void flushProgress(paper.id);
      }
      recordAppLeave();
    };
    const show = () => {
      void beat(false);
    };
    window.__bibleStagesAppHidden = hide;
    window.__bibleStagesAppShown = show;
    const onVis = () => {
      if (document.visibilityState === "hidden") hide();
      else show();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", hide);
    window.addEventListener("pageshow", show);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", hide);
      window.removeEventListener("pageshow", show);
      delete window.__bibleStagesAppHidden;
      delete window.__bibleStagesAppShown;
    };
  }, [beat, recordAppLeave, recordTabLeave, flushProgress]);

  useEffect(() => {
    if (session?.role !== "student") return;
    const tick = window.setInterval(() => {
      void beat(document.visibilityState === "hidden");
    }, 4000);
    void beat(document.visibilityState === "hidden");
    return () => window.clearInterval(tick);
  }, [session, beat, draft?.id]);

  return children;
}
