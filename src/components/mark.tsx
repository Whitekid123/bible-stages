import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path
        d="M8 9.5c3.2-1.6 6.2-.4 8 1.2 1.8-1.6 4.8-2.8 8-1.2V22c-3.2-1.4-6.2-.2-8 1.4-1.8-1.6-4.8-2.8-8-1.4V9.5Z"
        className="stroke-accent-fg"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M16 11v12" className="stroke-accent-fg" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
