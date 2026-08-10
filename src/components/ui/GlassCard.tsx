"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";
import { useIsTouch, usePrefersReducedMotion } from "@/lib/hooks";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  /** Inclinaison 3D et lumière qui suit le curseur. */
  interactive?: boolean;
  /** Intensité de l'inclinaison, en degrés. */
  tilt?: number;
  as?: "div" | "li" | "article";
};

/**
 * Surface de verre flottante.
 * Trois couches : le verre, la lumière qui suit le curseur, le liseré supérieur.
 */
export function GlassCard({
  children,
  className,
  interactive = true,
  tilt = 5,
  as = "div",
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isTouch = useIsTouch();
  const reduced = usePrefersReducedMotion();
  const active = interactive && !isTouch && !reduced;

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 150, damping: 20 });
  const sy = useSpring(py, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(sy, [0, 1], [tilt, -tilt]);
  const rotateY = useTransform(sx, [0, 1], [-tilt, tilt]);
  const glowX = useTransform(sx, (v) => `${v * 100}%`);
  const glowY = useTransform(sy, (v) => `${v * 100}%`);

  function handleMove(event: React.MouseEvent) {
    if (!active || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
  }

  function handleLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  const MotionTag = motion[as];

  return (
    <MotionTag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={
        active
          ? { rotateX, rotateY, transformPerspective: 1200 }
          : undefined
      }
      className={cn(
        "glass group/card relative isolate overflow-hidden rounded-card transition-[border-color,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        active && "hover:border-accent-soft/40",
        className,
      )}
    >
      {/* Lumière diffuse qui suit le curseur. */}
      {active && (
        <motion.span
          aria-hidden="true"
          style={{ left: glowX, top: glowY }}
          className="pointer-events-none absolute -z-1 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover/card:opacity-100"
        />
      )}
      {/* Liseré supérieur : le reflet d'une arête polie. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-white/25 to-transparent"
      />
      {children}
    </MotionTag>
  );
}
