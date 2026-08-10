"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { site } from "@/data/site";
import { LogoMark } from "./Logo";
import { useJourney } from "@/lib/useJourney";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ------------------------------------------------------------------ *
 * La jauge : l'unique bouton de navigation permanent.
 * ------------------------------------------------------------------ */

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function Gauge({
  progress,
  code,
  open,
  onToggle,
}: {
  progress: number;
  code: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? "Fermer le journal de bord" : "Ouvrir le journal de bord"}
      className="group pointer-events-auto relative flex h-14 w-14 items-center justify-center"
    >
      {/* Halo qui s'allume au survol : le seul retour visuel nécessaire. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-accent/25 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
      />

      <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90">
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-edge/70"
        />
        <circle
          cx="24"
          cy="24"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          // La jauge n'est pas une décoration : c'est la distance parcourue.
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          className="text-accent-soft transition-[stroke-dashoffset] duration-200 ease-linear drop-shadow-[0_0_5px_rgba(110,151,255,0.7)]"
        />
      </svg>

      <span className="relative flex h-full w-full items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              className="block h-3.5 w-3.5"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <svg viewBox="0 0 14 14" fill="none" className="h-full w-full">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </motion.span>
          ) : (
            <motion.span
              key={code}
              className="font-mono text-[0.6875rem] tracking-[0.06em] text-star tabular-nums"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.28 }}
            >
              {code}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * Le rail : la position dans le voyage, en périphérie du regard.
 * ------------------------------------------------------------------ */

function Rail({ index }: { index: number }) {
  return (
    <nav
      aria-label="Étapes du voyage"
      className="pointer-events-auto fixed top-1/2 right-5 z-70 hidden -translate-y-1/2 lg:block"
    >
      <ul className="flex flex-col items-end gap-1">
        {site.journey.map((step, i) => {
          const active = i === index;
          return (
            <li key={step.href}>
              <a
                href={step.href}
                aria-current={active ? "step" : undefined}
                className="group flex h-7 items-center justify-end gap-3"
              >
                {/* L'étiquette n'existe que pour l'étape active ou survolée :
                    le rail reste un trait, pas une liste de liens. */}
                <span
                  className={cn(
                    "font-mono text-[0.5625rem] tracking-[0.22em] uppercase transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    active
                      ? "translate-x-0 text-star opacity-100"
                      : "translate-x-2 text-dim opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                  )}
                >
                  {step.label}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "block h-px transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    active
                      ? "w-8 bg-accent-soft shadow-[0_0_8px_0_rgba(110,151,255,0.9)]"
                      : "w-3 bg-edge group-hover:w-5 group-hover:bg-mist",
                  )}
                />
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------------------ *
 * Le journal de bord : ce qui remplace le menu.
 * ------------------------------------------------------------------ */

function Logbook({
  open,
  index,
  onClose,
}: {
  open: boolean;
  index: number;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="logbook"
          role="dialog"
          aria-modal="true"
          aria-label="Journal de bord"
          className="fixed inset-0 z-80 flex flex-col justify-center overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, delay: 0.15 } }}
          transition={{ duration: 0.3 }}
        >
          {/* Le vide se referme par le bas : un volet, pas un fondu. */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 origin-bottom bg-void/94 backdrop-blur-2xl"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.75, ease: [0.83, 0, 0.17, 1] }}
          />

          <nav
            aria-label="Navigation"
            className="relative container-x py-24 sm:py-28"
          >
            <ul>
              {site.journey.map((step, i) => (
                <motion.li
                  key={step.href}
                  initial={{ opacity: 0, y: 34, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 12, transition: { duration: 0.25 } }}
                  transition={{
                    duration: 0.85,
                    delay: 0.3 + i * 0.045,
                    ease: EASE,
                  }}
                >
                  <a
                    href={step.href}
                    onClick={onClose}
                    className="group flex items-baseline gap-5 border-b border-edge/25 py-3 sm:gap-8 sm:py-4"
                  >
                    <span
                      className={cn(
                        "w-6 shrink-0 font-mono text-[0.625rem] tabular-nums transition-colors duration-500",
                        i === index ? "text-accent-soft" : "text-dim",
                      )}
                    >
                      {step.code}
                    </span>

                    <span
                      className={cn(
                        "type-safe flex-1 font-display text-[clamp(1.9rem,7vw,4.5rem)] leading-[0.94] font-medium tracking-[-0.04em] transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        i === index
                          ? "text-star"
                          : "text-mist/45 group-hover:translate-x-3 group-hover:text-star",
                      )}
                    >
                      {step.label}
                    </span>

                    <span className="hidden font-mono text-[0.625rem] tracking-[0.2em] text-dim uppercase transition-colors duration-500 group-hover:text-accent-soft/80 sm:block">
                      {step.body}
                    </span>
                  </a>
                </motion.li>
              ))}
            </ul>

            <motion.div
              className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, delay: 0.7 }}
            >
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                <a
                  href={`mailto:${site.contact.email}`}
                  className="text-sm text-mist transition-colors duration-300 hover:text-star"
                >
                  {site.contact.email}
                </a>
                <a
                  href={`tel:${site.contact.phoneRaw}`}
                  className="text-sm text-mist transition-colors duration-300 hover:text-star"
                >
                  {site.contact.phone}
                </a>
              </div>
              <p className="font-mono text-[0.5625rem] tracking-[0.24em] text-dim uppercase">
                {site.location.city} · {site.location.regionCode}
              </p>
            </motion.div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ *
 * Le HUD.
 * ------------------------------------------------------------------ */

/**
 * Il n'y a pas de barre d'en-tête.
 *
 * Rien ne traverse le haut de l'écran : la marque tient dans un coin,
 * la navigation dans un autre, la position dans la marge droite et la
 * télémétrie en bas. Le contenu n'est jamais bordé — c'est ce qui donne
 * la sensation d'être dans un habitacle plutôt que sur un site.
 */
export function Hud() {
  const { index, progress, atStart } = useJourney();
  const [open, setOpen] = useState(false);

  const step = site.journey[index] ?? site.journey[0];

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {/* La marque, seule, sans bloc autour. */}
      <div className="pointer-events-none fixed top-5 left-5 z-90 md:top-7 md:left-10 lg:left-16">
        <a
          href="#top"
          aria-label={`${site.name} — retour au départ`}
          className="pointer-events-auto group flex items-center gap-3"
        >
          <LogoMark className="h-8 w-8 text-accent-soft transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-180" />
          <motion.span
            className="hidden overflow-hidden font-display text-[0.8125rem] tracking-[0.3em] whitespace-nowrap text-star uppercase sm:block"
            animate={{
              width: atStart && !open ? "auto" : 0,
              opacity: atStart && !open ? 1 : 0,
            }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            Kubyza
          </motion.span>
        </a>
      </div>

      {/* La jauge d'accès. */}
      <div className="pointer-events-none fixed top-4 right-4 z-90 md:top-6 md:right-8 lg:right-12">
        <Gauge
          progress={progress}
          code={step.code}
          open={open}
          onToggle={() => setOpen((value) => !value)}
        />
      </div>

      {/* Le rail de position — absent tant qu'on est au départ. */}
      <motion.div
        animate={{ opacity: atStart || open ? 0 : 1, x: atStart || open ? 14 : 0 }}
        transition={{ duration: 0.8, ease: EASE }}
        className={cn(atStart || open ? "pointer-events-none" : "")}
      >
        <Rail index={index} />
      </motion.div>

      {/* La télémétrie : où l'on est, ce qu'on croise. */}
      <AnimatePresence>
        {!atStart && !open && (
          <motion.div
            key="telemetry"
            aria-hidden="true"
            className="pointer-events-none fixed bottom-5 left-5 z-70 hidden md:bottom-7 md:left-10 md:block lg:left-16"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-1 w-1">
                <span className="absolute inset-0 animate-ping rounded-full bg-accent-soft opacity-70" />
                <span className="relative h-1 w-1 rounded-full bg-accent-soft" />
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={step.href}
                  className="font-mono text-[0.5625rem] tracking-[0.26em] text-mist uppercase"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                >
                  {step.body}
                </motion.span>
              </AnimatePresence>
            </div>
            <p className="mt-1.5 pl-4 font-mono text-[0.5625rem] tracking-[0.22em] text-dim tabular-nums">
              {String(Math.round(progress * 100)).padStart(3, "0")} / 100
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Le contact, discret, opposé à la télémétrie. */}
      <AnimatePresence>
        {!atStart && !open && (
          <motion.a
            key="hail"
            href="#contact"
            className="group pointer-events-auto fixed right-4 bottom-5 z-70 flex items-center gap-2.5 rounded-full border border-edge/60 bg-void/50 px-4 py-2.5 backdrop-blur-xl transition-colors duration-500 hover:border-accent-soft/60 md:right-8 md:bottom-7 lg:right-12"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-soft shadow-[0_0_8px_1px_rgba(110,151,255,0.8)]" />
            <span className="font-mono text-[0.5625rem] tracking-[0.24em] text-star uppercase">
              Nous contacter
            </span>
          </motion.a>
        )}
      </AnimatePresence>

      <Logbook open={open} index={index} onClose={() => setOpen(false)} />
    </>
  );
}
