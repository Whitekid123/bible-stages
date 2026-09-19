import { useAppStore } from "@/lib/app-store";
import { cn } from "@/lib/utils";

export function LiveLine({ invert = false }: { invert?: boolean }) {
  const online = useAppStore((s) => s.online);
  if (online === null) return null;

  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        online
          ? invert
            ? "bg-ok/20 text-accent-fg"
            : "bg-ok/10 text-ok"
          : invert
            ? "bg-danger/25 text-accent-fg"
            : "bg-danger/10 text-danger",
      )}
    >
      <span className={cn("size-1.5 rounded-full", online ? "bg-ok" : "bg-danger")} />
      {online
        ? "Hall is live — every phone is on the same exam."
        : "No connection. Turn on internet so the teacher can see this paper."}
    </p>
  );
}
