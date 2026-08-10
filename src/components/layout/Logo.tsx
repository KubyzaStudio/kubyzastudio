import { cn } from "@/lib/utils";

/**
 * Marque Kubyza : un corps céleste et sa trajectoire.
 * Dessinée en traits fins pour rester lisible à 20 px comme à 200 px.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-7 w-7", className)}
    >
      <circle cx="16" cy="16" r="6.4" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="16" cy="16" r="2.2" fill="currentColor" opacity="0.85" />
      <ellipse
        cx="16"
        cy="16"
        rx="14.4"
        ry="6.2"
        stroke="currentColor"
        strokeWidth="0.9"
        opacity="0.5"
        transform="rotate(-28 16 16)"
      />
      <circle cx="27.4" cy="10.4" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-7 w-7 text-accent-soft" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[0.95rem] font-medium tracking-[0.22em] text-star uppercase">
          Kubyza
        </span>
        <span className="mt-1 font-mono text-[0.5625rem] tracking-[0.34em] text-dim uppercase">
          Studio
        </span>
      </span>
    </span>
  );
}
