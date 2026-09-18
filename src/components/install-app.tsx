import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isIosDevice,
  isStandaloneApp,
  readInstallDismissed,
  writeInstallDismissed,
} from "@/lib/pwa";

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallApp({ compact = false }: { compact?: boolean }) {
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [promptEvent, setPromptEvent] = useState<PromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setStandalone(isStandaloneApp());
    setIos(isIosDevice());
    setDismissed(readInstallDismissed());

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as PromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => {
      setStandalone(true);
      setPromptEvent(null);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone) {
    return compact ? null : (
      <p className="rounded-lg border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">
        Bible Stages is installed on this phone. Open it from the home screen next time.
      </p>
    );
  }

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setStandalone(true);
    setPromptEvent(null);
  }

  function hide() {
    writeInstallDismissed();
    setDismissed(true);
  }

  if (compact && dismissed && !promptEvent) return null;

  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-4 shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg leading-tight">Install the app</p>
          <p className="mt-1 text-sm text-muted">
            Put Bible Stages on the home screen. It opens like a normal app, keeps the question pack
            on this phone, and does not need the browser.
          </p>
        </div>
        {compact ? (
          <button
            type="button"
            className="rounded-md p-2 text-muted hover:bg-bg-subtle hover:text-fg"
            onClick={hide}
            aria-label="Hide install help"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {promptEvent ? (
        <Button className="mt-4 w-full" onClick={() => void install()}>
          <Download className="size-4" />
          Add to this phone
        </Button>
      ) : ios ? (
        <ol className="mt-3 space-y-2 text-sm text-fg">
          <li className="flex gap-2">
            <Share className="mt-0.5 size-4 shrink-0 text-accent" />
            Tap the Share button in Safari
          </li>
          <li>Scroll and tap Add to Home Screen</li>
          <li>Open Bible Stages from the new icon</li>
        </ol>
      ) : (
        <p className="mt-3 text-sm text-muted">
          On Android Chrome: menu (⋮) → <span className="font-medium text-fg">Install app</span> or
          Add to Home screen.
        </p>
      )}
    </div>
  );
}
