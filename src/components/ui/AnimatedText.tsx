"use client";

import { motion, type Variants } from "motion/react";
import { createElement, Fragment } from "react";
import { cn } from "@/lib/utils";

type AnimatedTextProps = {
  text: string;
  className?: string;
  /** Balise rendue — garde une hiérarchie de titres correcte. */
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
  /** Mot par mot (défaut) ou ligne par ligne pour les longs paragraphes. */
  by?: "word" | "line";
  /** `true` : joue au montage plutôt qu'à l'entrée dans le viewport. */
  immediate?: boolean;
};

const container = (delay: number, stagger: number): Variants => ({
  hidden: {},
  visible: {
    transition: { delayChildren: delay, staggerChildren: stagger },
  },
});

const child: Variants = {
  hidden: { opacity: 0, y: "0.35em", filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: "0em",
    filter: "blur(0px)",
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
  },
};

/**
 * Titre qui se matérialise : chaque mot arrive flou puis devient net.
 * Le texte complet reste lisible par les lecteurs d'écran via `aria-label`.
 */
export function AnimatedText({
  text,
  className,
  as = "h2",
  delay = 0,
  by = "word",
  immediate = false,
}: AnimatedTextProps) {
  const parts = by === "word" ? text.split(" ") : text.split("\n");
  const stagger = by === "word" ? 0.055 : 0.12;

  const animationProps = immediate
    ? { animate: "visible" as const }
    : {
        whileInView: "visible" as const,
        viewport: { once: true, margin: "0px 0px -10% 0px" },
      };

  return createElement(
    motion[as],
    {
      className: cn(className),
      variants: container(delay, stagger),
      initial: "hidden",
      ...animationProps,
      "aria-label": text,
    },
    parts.map((part, index) => (
      <Fragment key={`${part}-${index}`}>
        <span
          // `line-mask` réserve la place des accents et des jambages :
          // sans elle, la queue du « g » est tranchée et se lit « q ».
          className="line-mask inline-block align-bottom"
          aria-hidden="true"
        >
          <motion.span variants={child} className="inline-block">
            {part}
            {by === "word" && index < parts.length - 1 ? " " : null}
          </motion.span>
        </span>
        {by === "line" && index < parts.length - 1 ? (
          <br aria-hidden="true" />
        ) : null}
      </Fragment>
    )),
  );
}
