import { CloudDownload } from "lucide-react";
import { useAppStore } from "@/lib/app-store";

export function PackStatus({ compact = false }: { compact?: boolean }) {
  const pack = useAppStore((s) => s.pack);
  const packing = useAppStore((s) => s.packing);
  const session = useAppStore((s) => s.session);
  const syncPack = useAppStore((s) => s.syncPack);
  const count = pack?.questions.filter((q) => q.published !== false).length ?? 0;
  const when = pack?.downloadedAt
    ? new Date(pack.downloadedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  if (session?.role === "teacher") {
    return (
      <p className="text-xs text-muted">
        {packing
          ? "Refreshing the lecturer bank…"
          : `${count} lecturer question${count === 1 ? "" : "s"} on this desk`}
      </p>
    );
  }

  return (
    <div className={compact ? "" : "rounded-lg border border-border bg-bg-elevated px-3 py-2 shadow-lift"}>
      <p className="flex items-center gap-2 text-sm text-fg">
        <CloudDownload className="size-4 text-accent" />
        {packing
          ? "Packing questions onto this device…"
          : count > 0
            ? `Lecturer pack ready · ${count} question${count === 1 ? "" : "s"}`
            : "Core bank ready on this device"}
      </p>
      <p className="mt-1 text-xs text-muted">
        {when
          ? `Downloaded at ${when}. Kept here even if you do not sit a paper now.`
          : "The five stage banks live on this device. Extra lecturer questions download when you enter."}
        {" "}
        <button type="button" className="text-accent underline-offset-2 hover:underline" onClick={() => void syncPack()}>
          Refresh pack
        </button>
      </p>
    </div>
  );
}
