"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useIsTouch, usePrefersReducedMotion } from "@/lib/hooks";

/**
 * LA COMMANDE DE LANCEMENT
 * ==========================================================================
 * Ce n'est pas un bouton. C'est un cadran : un anneau de texte qui tourne
 * lentement, un noyau qui suit le curseur, et une flèche au centre.
 *
 * Il n'y a qu'un seul appel à l'action visible dans l'écran d'ouverture —
 * pas deux boutons côte à côte, pas de « variante secondaire ». Une seule
 * chose à faire, et elle a l'air d'un instrument.
 */
export function LaunchControl({
  href,
  label = "Lancer votre mission · Kubyza Studio · ",
  className,
}: {
  href: string;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const isTouch = useIsTouch();
  const reduced = usePrefersReducedMotion();
  const magnetic = !isTouch && !reduced;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 170, damping: 17, mass: 0.5 });
  const y = useSpring(my, { stiffness: 170, damping: 17, mass: 0.5 });
  const innerX = useTransform(x, (v) => v * 0.4);
  const innerY = useTransform(y, (v) => v * 0.4);

  const characters = label.split("");
  const step = 360 / characters.length;

  return (
    <motion.a
      ref={ref}
      href={href}
      data-cursor="hover"
      aria-label="Lancer votre mission — aller au formulaire de contact"
      style={magnetic ? { x, y } : undefined}
      onMouseMove={(event) => {
        if (!magnetic || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        mx.set(((event.clientX - rect.left) / rect.width - 0.5) * 26);
        my.set(((event.clientY - rect.top) / rect.height - 0.5) * 26);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      className={cn(
        "group relative flex h-32 w-32 shrink-0 items-center justify-center sm:h-40 sm:w-40",
        className,
      )}
    >
      {/* La lueur : elle existe déjà au repos, elle ne s'allume pas au survol. */}
      <span
        aria-hidden="true"
        className="absolute inset-2 rounded-full bg-accent/22 blur-2xl transition-all duration-700 group-hover:inset-0 group-hover:bg-accent/40"
      />

      {/* L'anneau de texte. Un tour toutes les vingt secondes. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 text-mist transition-colors duration-700 group-hover:text-star"
        style={{ animation: reduced ? undefined : "orbit 20s linear infinite" }}
      >
        {characters.map((character, i) => (
          <span
            key={i}
            className="absolute top-1/2 left-1/2 origin-[0_0] font-mono text-[0.5rem] tracking-[0.05em] uppercase sm:text-[0.5625rem]"
            style={{
              transform: `rotate(${i * step}deg) translateY(-3.85rem)`,
            }}
          >
            {character}
          </span>
        ))}
      </span>

      {/* Le cercle d'assise. */}
      <span
        aria-hidden="true"
        className="absolute inset-[1.15rem] rounded-full border border-edge/80 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:inset-[0.95rem] group-hover:border-accent-soft/70 sm:inset-[1.6rem] sm:group-hover:inset-[1.35rem]"
      />

      {/* Le noyau. */}
      <motion.span
        style={magnetic ? { x: innerX, y: innerY } : undefined}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-star text-void shadow-[0_10px_30px_-8px_rgba(110,151,255,0.9)] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 sm:h-13 sm:w-13"
      >
        <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
          <path
            d="M8 1v14M8 15l-5-5M8 15l5-5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.span>
    </motion.a>
  );
}
