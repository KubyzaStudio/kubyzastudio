"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsTouch, usePrefersReducedMotion } from "@/lib/hooks";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  size?: Size;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  /** Lien externe : `target="_blank"` s'accompagne toujours de `rel`. */
  target?: string;
  rel?: string;
  "aria-label"?: string;
};

const base =
  "group/btn relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full font-medium tracking-tight transition-colors duration-500 disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-[0_0_0_1px_rgba(110,151,255,0.5),0_18px_50px_-16px_rgba(61,107,255,0.85)] hover:bg-accent-soft",
  outline:
    "border border-edge/90 bg-white/[0.03] text-star backdrop-blur-md hover:border-accent-soft/70 hover:bg-white/[0.06]",
  ghost: "text-mist hover:text-star",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-5 text-[0.8125rem]",
  md: "h-12 px-6 text-[0.9375rem] sm:h-13 sm:px-7",
  lg: "h-14 px-7 text-[0.9375rem] sm:h-15 sm:px-9 sm:text-base",
};

/**
 * Bouton vivant : il respire, réagit au curseur et laisse passer un reflet.
 * L'effet magnétique est désactivé au tactile et en mouvement réduit.
 */
export function Button({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  disabled,
  target,
  rel,
  ...rest
}: ButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const isTouch = useIsTouch();
  const reduced = usePrefersReducedMotion();
  const magnetic = !isTouch && !reduced;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 20, mass: 0.4 });
  const y = useSpring(my, { stiffness: 220, damping: 20, mass: 0.4 });
  // Le contenu suit le mouvement à moitié : ça crée la profondeur.
  const innerX = useTransform(x, (v) => v * 0.45);
  const innerY = useTransform(y, (v) => v * 0.45);

  function handleMove(event: React.MouseEvent) {
    if (!magnetic || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mx.set(((event.clientX - rect.left) / rect.width - 0.5) * 16);
    my.set(((event.clientY - rect.top) / rect.height - 0.5) * 10);
  }

  function handleLeave() {
    mx.set(0);
    my.set(0);
  }

  const content = (
    <>
      {/* Reflet qui traverse la surface au survol. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-100 from-transparent via-white/25 to-transparent transition-transform duration-900 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-full"
      />
      {/* Halo qui s'allume autour du bouton. */}
      {variant !== "ghost" && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-accent/25 opacity-0 blur-2xl transition-opacity duration-700 group-hover/btn:opacity-100"
        />
      )}
      <motion.span
        style={magnetic ? { x: innerX, y: innerY } : undefined}
        className="relative z-1 inline-flex items-center gap-2.5"
      >
        {children}
      </motion.span>
    </>
  );

  const classes = cn(base, variants[variant], sizes[size], className);
  const motionStyle = magnetic ? { x, y } : undefined;

  if (href) {
    return (
      <motion.a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        target={target}
        // Une cible externe sans `rel` laisserait la page ouvrante
        // accessible depuis l'onglet lancé : le repli est explicite.
        rel={rel ?? (target === "_blank" ? "noreferrer noopener" : undefined)}
        className={classes}
        style={motionStyle}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        data-cursor="hover"
        {...rest}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      style={motionStyle}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      data-cursor="hover"
      {...rest}
    >
      {content}
    </motion.button>
  );
}
