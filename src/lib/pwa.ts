const DISMISS_KEY = "bible-stages-install-dismissed";

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallKind = "ios-chrome" | "ios-safari" | "android-chrome" | "desktop-chrome" | "other";

let deferredPrompt: InstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

function notifyPrompt() {
  for (const listener of promptListeners) listener();
}

function rememberPrompt(event: Event) {
  event.preventDefault();
  deferredPrompt = event as InstallPromptEvent;
  notifyPrompt();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", rememberPrompt);
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyPrompt();
  });
}

export function getDeferredPrompt() {
  return deferredPrompt;
}

export function subscribeInstallPrompt(listener: () => void) {
  promptListeners.add(listener);
  return () => {
    promptListeners.delete(listener);
  };
}

export function clearDeferredPrompt() {
  deferredPrompt = null;
  notifyPrompt();
}

export function isStandaloneApp() {
  if (typeof window === "undefined") return false;
  const media = window.matchMedia("(display-mode: standalone)").matches;
  const ios = "standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone);
  return media || ios;
}

export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPhone = /iPhone|iPad|iPod/i.test(ua);
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iPhone || iPadOs;
}

export function installKind(): InstallKind {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const ios = isIosDevice();
  if (ios && /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)) return "ios-chrome";
  if (ios) return "ios-safari";
  if (/Android/i.test(ua) && /Chrome|EdgA/i.test(ua)) return "android-chrome";
  if (/Chrome|Edg|Chromium/i.test(ua) && !/OPR|Opera/i.test(ua)) return "desktop-chrome";
  return "other";
}

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;
  void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
}

export function readInstallDismissed() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeInstallDismissed() {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* private mode */
  }
}

export async function copyClassLink() {
  const href = window.location.origin + "/";
  try {
    await navigator.clipboard.writeText(href);
    return href;
  } catch {
    return href;
  }
}
