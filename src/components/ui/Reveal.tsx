"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y,
      filter: blur ? "blur(12px)" : "blur(0px)",
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
