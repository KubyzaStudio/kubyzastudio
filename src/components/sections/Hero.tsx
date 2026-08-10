"use client";

import { motion, type Variants } from "motion/react";
import { site } from "@/data/site";
import { useLaunched } from "@/components/providers/LaunchContext";
import { LaunchControl } from "@/components/ui/LaunchControl";

const EASE = [0.16, 1, 0.3, 1] as const;

const stage: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.2, staggerChildren: 0.09 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.2, ease: EASE },
  },
};

const lineUp: Variants = {
  hidden: { y: "108%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: 1.5, ease: EASE },
  },
};

/**
 * LE DÉPART
 * ==========================================================================
 * Le slogan n'est pas un bloc de trois lignes alignées à gauche : c'est une
 * phrase éclatée dans l'écran. Chaque ligne a son propre retrait, sa propre
 * échelle, et le vide entre elles fait partie du dessin.
 *
 * Il n'y a ni rangée de boutons, ni paragraphe sous le titre. Une seule
 * commande, en bas à gauche, et la promesse rejetée dans le coin opposé.
 */
export function Hero() {
  const launched = useLaunched();
  const state = launched ? "visible" : "hidden";

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden pt-28 pb-12 sm:pt-36 sm:pb-14"
    >
      {/* Coordonnées, posées dans la marge — verticales, hors du flux.
          Elles appartiennent au décor, pas à la composition du texte. */}
      <motion.div
        className="pointer-events-none absolute top-1/2 left-4 hidden -translate-y-1/2 xl:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: launched ? 1 : 0 }}
        transition={{ duration: 1.4, delay: 0.9 }}
      >
        <p
          className="font-mono text-[0.5625rem] tracking-[0.4em] text-dim uppercase"
          style={{ writingMode: "vertical-rl" }}
        >
          {site.location.latitude.toFixed(4)}° N · {site.location.longitude.toFixed(4)}° E
        </p>
      </motion.div>

      <motion.div
        className="container-x relative z-1 flex flex-1 flex-col justify-center"
        variants={stage}
        initial="hidden"
        animate={state}
      >
        {/* Le repère. Aligné sur la deuxième ligne du titre, pas au-dessus. */}
        <motion.div
          variants={rise}
          className="mb-10 flex items-center gap-3 sm:mb-14 sm:pl-[8%]"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-accent-soft opacity-70" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-accent-soft" />
          </span>
          <span className="label-mono text-mist">
            {site.location.city} · {site.location.regionCode}
          </span>
        </motion.div>

        {/*
          L'ÉCHELLE DU SLOGAN
          ------------------------------------------------------------------
          Trois lignes, trois rôles — et le rapport entre elles doit tenir
          à 320 px comme à 1 920 px. Les bornes basses des `clamp` ont donc
          été relevées ensemble : sur un petit écran, la ligne 2 restait
          seule à porter la phrase pendant que les deux autres tombaient
          sous la taille d'un paragraphe. Le rapport tenu ici est ~1 : 2,4 :
          2, quelle que soit la largeur.

          Le suivi de caractères (`tracking`) se desserre sur mobile : à
          petite taille, un crénage de −0,05 em colle les lettres et c'est
          la lisibilité qui paie. Le jambage du « g » de « en ligne », lui,
          est réservé par `line-mask` et `type-luminous` (voir la note
          « JAMBAGES » dans globals.css) — jamais par une taille réduite.
        */}
        <h1 className="relative">
          {/* Ligne 1 — petite, discrète, en retrait. Elle annonce. */}
          <span className="line-mask">
            <motion.span
              variants={lineUp}
              className="block font-display text-[clamp(1.25rem,4.6vw,3rem)] leading-[1.05] font-normal tracking-[-0.01em] text-mist sm:tracking-[-0.02em]"
            >
              Nous lançons
            </motion.span>
          </span>

          {/* Ligne 2 — la masse. Elle occupe la largeur disponible. */}
          <span className="line-mask mt-1.5 sm:mt-2">
            <motion.span
              variants={lineUp}
              className="block font-display text-[clamp(2.75rem,11.6vw,10rem)] leading-[0.9] font-medium tracking-[-0.035em] text-star sm:leading-[0.86] sm:tracking-[-0.05em]"
            >
              votre présence
            </motion.span>
          </span>

          {/* Ligne 3 — rejetée à droite, plus petite : la phrase retombe.
              C'est ici que se trouve le « g » : la réserve de jambage est
              portée par `line-mask` et par `type-luminous`. */}
          <span className="line-mask mt-1.5 flex justify-end sm:mt-3">
            <motion.span
              variants={lineUp}
              className="type-luminous block font-display text-[clamp(2.35rem,9.4vw,7rem)] leading-[0.95] font-medium tracking-[-0.03em] sm:leading-[0.9] sm:tracking-[-0.045em]"
            >
              en ligne.
            </motion.span>
          </span>
        </h1>
      </motion.div>

      {/*
        LE PIED DE L'ÉCRAN
        --------------------------------------------------------------------
        Sur grand écran : commande à gauche, promesse à droite, et le vide
        au milieu donne l'échelle.

        Sur téléphone, ce vide n'existe pas — il ne reste que 280 px entre
        les deux, et la promesse se cassait en six lignes ferrées à droite
        contre un cadran de 128 px. La composition est donc inversée plutôt
        que rétrécie : la phrase prend toute la largeur, alignée à gauche
        comme le reste de la page, et la commande passe DESSOUS, sur sa
        propre ligne, avec le lien secondaire en face d'elle. Rien n'a été
        réduit ; l'ordre de lecture a changé.
      */}
      <motion.div
        className="container-x relative z-1 flex flex-col gap-9 sm:flex-row sm:items-end sm:justify-between sm:gap-8"
        variants={stage}
        initial="hidden"
        animate={state}
      >
        <motion.div
          variants={rise}
          className="order-2 flex items-center justify-between gap-6 sm:order-1 sm:block"
        >
          <LaunchControl href="#contact" />

          {/* Au doigt, ce lien secondaire vient se poser à côté du cadran :
              il occupe l'espace laissé libre au lieu d'ajouter une ligne.
              Sur grand écran, c'est son jumeau ci-dessous qui prend le
              relais, sous la promesse — un seul des deux existe à la fois. */}
          <a
            href="#realisations"
            className="group inline-flex items-center gap-2.5 text-sm text-dim transition-colors duration-500 hover:text-star sm:hidden"
          >
            <span
              aria-hidden="true"
              className="block h-px w-6 bg-edge transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-10 group-hover:bg-accent-soft"
            />
            Les missions
          </a>
        </motion.div>

        <motion.div
          variants={rise}
          className="order-1 max-w-xs text-left sm:order-2 sm:pb-6 sm:text-right"
        >
          <p className="text-sm leading-relaxed text-mist sm:text-base">
            {site.subline}
          </p>
          <a
            href="#realisations"
            className="group mt-5 hidden items-center gap-2.5 text-sm text-dim transition-colors duration-500 hover:text-star sm:inline-flex"
          >
            <span
              aria-hidden="true"
              className="block h-px w-6 bg-edge transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-10 group-hover:bg-accent-soft"
            />
            Voir les missions
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
