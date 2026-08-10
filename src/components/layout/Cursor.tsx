"use client";

import { useEffect, useRef } from "react";
import { useIsTouch, usePrefersReducedMotion } from "@/lib/hooks";
import { lerp } from "@/lib/utils";

/**
 * Curseur personnalisé : un point net, un halo qui le rattrape.
 * Écrit en manipulation directe du DOM — zéro rendu React par frame.
 * Absent au tactile et en mouvement réduit.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const isTouch = useIsTouch();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (isTouch || reduced) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let scale = 1;
    let targetScale = 1;
    let frame = 0;
    let visible = false;

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
      const el = event.target as HTMLElement | null;
      const interactive = el?.closest(
        'a, button, [data-cursor="hover"], input, textarea, label, summary',
      );
      targetScale = interactive ? 2.6 : 1;
      ring.dataset.state = interactive ? "active" : "idle";
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const render = () => {
      ringX = lerp(ringX, targetX, 0.16);
      ringY = lerp(ringY, targetY, 0.16);
      scale = lerp(scale, targetScale, 0.14);
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale})`;
      frame = requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [isTouch, reduced]);

  if (isTouch || reduced) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-90 hidden md:block">
      <div
        ref={ringRef}
        data-state="idle"
        className="fixed top-0 left-0 h-9 w-9 rounded-full border border-accent-soft/60 opacity-0 transition-[background-color,border-color,opacity] duration-300 data-[state=active]:border-accent-soft data-[state=active]:bg-accent/10"
      />
      <div
        ref={dotRef}
        className="fixed top-0 left-0 h-1.5 w-1.5 rounded-full bg-accent-glow opacity-0 shadow-[0_0_12px_2px_rgba(110,151,255,0.9)] transition-opacity duration-300"
      />
    </div>
  );
}
