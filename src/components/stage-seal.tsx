import { cn } from "@/lib/utils";

export function StageSeal({
  roman,
  className,
  tone = "paper",
}: {
  roman: string;
  className?: string;
  tone?: "paper" | "dark";
}) {
  return (
    <span
      className={cn(
        "grid size-12 shrink-0 place-items-center rounded-md font-display text-xl leading-none",
        tone === "dark" ? "bg-accent-fg/10 text-accent-fg" : "bg-accent text-accent-fg",
        className,
      )}
      aria-hidden="true"
    >
      {roman}
    </span>
  );
}
