"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Nombre qui rejoint sa nouvelle valeur.
 * Utilisé par le calculateur : un montant qui saute n'inspire pas confiance,
 * un montant qui se stabilise, si.
 */
export function Counter({
  value,
  format = (n: number) => String(Math.round(n)),
  duration = 700,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    // Mouvement réduit : la valeur est lue directement au rendu, pas animée.
    if (reduced) return;

    const start = performance.now();
    const origin = from.current;
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(origin + (value - origin) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      from.current = value;
    };
  }, [value, duration, reduced]);

  return (
    <span className={className} suppressHydrationWarning>
      {format(reduced ? value : display)}
    </span>
  );
}
