import { cn } from "@/lib/utils";

export function NaveMotif({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 210"
      className={cn("text-accent-fg", className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M80 10C80 10 28 62 28 112v78h104v-78C132 62 80 10 80 10Z"
        className="stroke-current"
        strokeWidth="1.6"
        opacity="0.35"
      />
      <path d="M80 10v180M28 112h104" className="stroke-current" strokeWidth="1.2" opacity="0.28" />
      <path d="M54 112v78M106 112v78" className="stroke-current" strokeWidth="1" opacity="0.2" />
      <circle cx="80" cy="86" r="10" className="stroke-current" strokeWidth="1.2" opacity="0.35" />
    </svg>
  );
}
