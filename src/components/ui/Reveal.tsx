"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsTouch } from "@/lib/hooks";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Retard en secondes — pour cascader plusieurs éléments. */
  delay?: number;
  /** Distance de départ, en pixels. */
  y?: number;
  /** Le voile lumineux qui se dissipe : le signal qui arrive. */
  blur?: boolean;
  as?: "div" | "li" | "section" | "article" | "span";
};

/**
 * Apparition au scroll : opacité, léger déplacement, flou qui se dissipe.
 * Le mouvement est lent et unique — jamais de rejeu au scroll inverse.
 *
 * LE VOILE ET LE TÉLÉPHONE
 * --------------------------------------------------------------------------
 * `filter: blur()` est la seule propriété animée ici qui ne soit pas
 * composable : le navigateur la recalcule à chaque frame, sur toute la boîte
 * de l'élément, et il ne peut pas déléguer ce travail au GPU comme il le fait
 * pour l'opacité et la translation. Ce composant enveloppe une centaine de
 * blocs sur la page — au défilement, sur un téléphone, cela se paie en images
 * perdues.
 *
 * Au doigt, le voile est donc retiré ; le déplacement et le fondu, eux,
 * restent identiques au pixel près. C'est le seul endroit du site où une
 * intention visuelle est arbitrée par l'appareil, et c'est délibéré : le voile
 * est un raffinement qu'on remarque sur un grand écran et jamais sur un petit.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 26,
  blur = true,
  as = "div",
}: RevealProps) {
  const MotionTag = motion[as];
  const isTouch = useIsTouch();
  const veil = blur && !isTouch;

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y,
      filter: veil ? "blur(12px)" : "blur(0px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 1.1,
        delay,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <MotionTag
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
    >
      {children}
    </MotionTag>
  );
}
