"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * LE REPÈRE DE SECTION
 * ==========================================================================
 * Ce composant remplace l'ancien bloc « étiquette + titre + phrase
 * d'introduction ». Il ne contient qu'une étiquette, et il la pose dans la
 * marge — verticalement sur grand écran, en tête de ligne sinon.
 *
 * C'est délibéré : à partir du moment où toutes les sections partagent le
 * même en-tête, la page devient un gabarit. Ici, le repère ne fait
 * qu'annoncer ; chaque section compose son titre à sa manière, à sa
 * propre échelle et à sa propre place.
 */
export function SectionMarker({
  code,
  label,
  className,
  side = "left",
}: {
  code: string;
  label: string;
  className?: string;
  /** Marge dans laquelle le repère se pose. */
  side?: "left" | "right";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className={cn("flex items-center gap-3", className)}
    >
      <span className="font-mono text-[0.625rem] text-dim tabular-nums">{code}</span>
      <span
        aria-hidden="true"
        className={cn("block h-px w-8 bg-accent/50", side === "right" && "order-first")}
      />
      <span className="label-mono">{label}</span>
    </motion.div>
  );
}

/**
 * Le même repère, mais couché dans la marge extérieure.
 * Réservé aux grands écrans : sur mobile, la marge n'existe pas.
 */
export function EdgeMarker({ label }: { label: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-4 hidden h-full xl:block"
    >
      <span
        className="sticky top-1/2 block font-mono text-[0.5625rem] tracking-[0.42em] text-dim/70 uppercase"
        style={{ writingMode: "vertical-rl" }}
      >
        {label}
      </span>
    </div>
  );
}
