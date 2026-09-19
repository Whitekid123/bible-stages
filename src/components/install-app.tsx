import { useEffect, useState } from "react";
import { Copy, Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clearDeferredPrompt,
  copyClassLink,
  getDeferredPrompt,
  installKind,
  isStandaloneApp,
  readInstallDismissed,
  subscribeInstallPrompt,
  writeInstallDismissed,
  type InstallKind,
} from "@/lib/pwa";

export function InstallApp({ compact = false }: { compact?: boolean }) {
  const [standalone, setStandalone] = useState(false);
  const [kind, setKind] = useState<InstallKind>("other");
  const [canPrompt, setCanPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneApp());
    setKind(installKind());
    setDismissed(readInstallDismissed());
    setCanPrompt(Boolean(getDeferredPrompt()));
    return subscribeInstallPrompt(() => {
      setCanPrompt(Boolean(getDeferredPrompt()));
      setStandalone(isStandaloneApp());
    });
  }, []);

  if (standalone) {
    return compact ? null : (
      <p className="rounded-lg border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">
        Bible Stages is on this device. Open it from the home screen next time — not from Chrome.
      </p>
    );
  }

  async function install() {
    const promptEvent = getDeferredPrompt();
    if (!promptEvent) return;
    setBusy(true);
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setBusy(false);
    if (choice.outcome === "accepted") setStandalone(true);
    clearDeferredPrompt();
    setCanPrompt(false);
  }

  async function copy() {
    await copyClassLink();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function hide() {
    writeInstallDismissed();
    setDismissed(true);
  }

  if (compact && dismissed && !canPrompt) return null;

  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-4 shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg leading-tight">Put this on the home screen</p>
          <p className="mt-1 text-sm text-muted">
            There is no Play Store file. Chrome does not download an app from a blue link. You
            install from the Chrome menu, or from the button below when Chrome offers it.
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

      {canPrompt ? (
        <Button className="mt-4 w-full" size="lg" disabled={busy} onClick={() => void install()}>
          <Download className="size-4" />
          {busy ? "Waiting for Chrome…" : "Install Bible Stages"}
        </Button>
      ) : null}

      <ol className="mt-4 space-y-2 text-sm text-fg">
        {kind === "ios-chrome" ? (
          <>
            <li className="font-medium text-warn">
              Chrome on iPhone cannot install apps to the home screen.
            </li>
            <li>Copy the class link with the button below.</li>
            <li>Open <span className="font-medium">Safari</span> (the compass icon).</li>
            <li>Paste the link, then Share → Add to Home Screen.</li>
          </>
        ) : kind === "ios-safari" ? (
          <>
            <li className="flex gap-2">
              <Share className="mt-0.5 size-4 shrink-0 text-accent" />
              Tap the Share button (square with an arrow)
            </li>
            <li>Scroll and tap <span className="font-medium">Add to Home Screen</span></li>
            <li>Open the new Bible Stages icon</li>
          </>
        ) : kind === "android-chrome" ? (
          <>
            <li>Tap the three dots <span className="font-medium">⋮</span> at the top right of Chrome</li>
            <li>
              Tap <span className="font-medium">Install app</span> or{" "}
              <span className="font-medium">Add to Home screen</span>
            </li>
            <li>Confirm. Then open Bible Stages from the home screen</li>
          </>
        ) : kind === "desktop-chrome" ? (
          <>
            <li>
              Look in the Chrome address bar for a computer icon, or open the three dots{" "}
              <span className="font-medium">⋮</span>
            </li>
            <li>
              Tap <span className="font-medium">Cast, save and share</span> →{" "}
              <span className="font-medium">Install page as app</span>
            </li>
            <li>That is the download. Chrome will not save an .apk or .exe file.</li>
          </>
        ) : (
          <>
            <li>On Android: Chrome menu ⋮ → Install app</li>
            <li>On iPhone: open this page in Safari → Share → Add to Home Screen</li>
          </>
        )}
      </ol>

      <Button variant="outline" className="mt-4 w-full" onClick={() => void copy()}>
        <Copy className="size-4" />
        {copied ? "Copied" : "Copy class link"}
      </Button>
    </div>
  );
}
