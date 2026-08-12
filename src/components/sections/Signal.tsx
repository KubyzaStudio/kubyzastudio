"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { site } from "@/data/site";
import { useDeviceTier, useIsTouch, usePrefersReducedMotion } from "@/lib/hooks";
import { ArrowUpRight, Close } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

/** Le moteur 3D de la section n'est demandé qu'une fois la section utile. */
const SignalStage = dynamic(
  () => import("@/components/3d/SignalStage").then((m) => m.SignalStage),
  { ssr: false, loading: () => null },
);

const EASE = [0.16, 1, 0.3, 1] as const;

const [primary, ...satellites] = site.channels;

/**
 * SIGNAL
 * ==========================================================================
 * Une seule chose à faire dans toute la page : ouvrir le canal.
 *
 * La version précédente demandait au visiteur de deviner trois choses à la
 * fois — que l'objet était un objet, qu'il était cliquable, et que derrière
 * lui se trouvaient des comptes à suivre. Personne ne devine trois choses.
 *
 * Le décor n'a pas bougé : même vide, même pièce de verre qui tourne, même
 * silence. Ce qui a changé, c'est qu'on ne demande plus rien à personne. La
 * fréquence est nommée, l'objet est nommé (SNAP), la commande est visible et
 * porte un verbe, et les trois canaux sont annoncés SOUS la commande — on
 * sait ce qu'on va trouver avant d'appuyer. La découverte reste entière :
 * c'est l'éclat, pas le mystère de l'interface.
 */
export function Signal() {
  const tier = useDeviceTier();
  const reduced = usePrefersReducedMotion();
  const isTouch = useIsTouch();
  const canRender3d = tier !== "low" && !reduced;

  const [opened, setOpened] = useState(false);
  const [hovering, setHovering] = useState(false);
  /** Le visiteur a touché l'objet au moins une fois : l'appel se retire. */
  const [greeted, setGreeted] = useState(false);
  /** Incrémenté par la commande : l'éclat part de l'objet, pas du bouton. */
  const [request, setRequest] = useState(0);

  const section = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);

  const open = useCallback(() => {
    setGreeted(true);
    setOpened(true);
  }, []);
  const close = useCallback(() => setOpened(false), []);

  const requestOpen = useCallback(() => {
    setGreeted(true);
    if (canRender3d) setRequest((value) => value + 1);
    else setOpened(true);
  }, [canRender3d]);

  /*
    Le canvas de la section — moteur, géométrie, cube map — n'est monté que
    lorsque la section approche. Sur téléphone, c'est la différence entre
    deux contextes WebGL vivants en permanence et un seul.
  */
  useEffect(() => {
    const el = section.current;
    if (!el || near) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "60% 0px 60% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near]);

  // Panneau ouvert : plus rien ne défile derrière, et Échap referme.
  useEffect(() => {
    if (!opened) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [opened, close]);

  const callToAction = isTouch ? "Appuyez pour connecter" : "Ouvrir le signal";

  return (
    <section
      ref={section}
      id="signal"
      className="relative isolate flex flex-col justify-center overflow-hidden py-24 sm:min-h-[125svh] sm:py-40"
    >
      {/* Repère de canal — collé au bord, pas dans la grille. */}
      <div className="pointer-events-none absolute top-10 left-5 z-2 md:top-16 md:left-10 lg:left-16">
        <p className="font-mono text-[0.625rem] tracking-[0.34em] text-dim uppercase">
          Canal direct
        </p>
        <p className="mt-2 font-mono text-[0.625rem] tracking-[0.2em] text-accent-soft/70 uppercase tabular-nums">
          FRÉQ. 0<span className="text-star">1</span> · {site.channels.length}{" "}
          canaux
        </p>
      </div>

      {/* La scène. Elle occupe la page, sans conteneur ni marge. */}
      <div className="relative mt-20 h-[46svh] max-h-[30rem] min-h-[17rem] w-full sm:mt-0 sm:h-[64svh] sm:max-h-none sm:min-h-[26rem]">
        {canRender3d && near ? (
          <SignalStage
            opened={opened}
            onOpen={open}
            onHoverChange={setHovering}
            detail={tier === "high" ? 1 : 0.6}
            // Au doigt, il n'y a pas de survol : c'est l'objet qui doit
            // faire le premier pas. À la souris, le survol suffit — une
            // oscillation permanente y deviendrait du bruit.
            attention={!greeted && isTouch}
            request={request}
          />
        ) : (
          /* Sans WebGL, l'objet devient un artefact plat — mais il reste
             l'objet, avec sa lueur et son invitation. */
          <button
            type="button"
            onClick={requestOpen}
            className="absolute inset-0 mx-auto flex w-full max-w-sm items-center justify-center"
            aria-label={`Ouvrir le signal — ${site.channels
              .map((channel) => channel.label)
              .join(", ")}`}
          >
            <span
              className={cn(
                "relative block aspect-square w-[58%]",
                !greeted && !reduced && "animate-drift",
              )}
            >
              <span className="absolute inset-[-30%] rounded-full bg-[#ffc529]/16 blur-[70px]" />
              <Image
                src={primary.artifact}
                alt=""
                fill
                sizes="60vw"
                className="relative object-contain mix-blend-screen"
              />
            </span>
          </button>
        )}

        {/* L'anneau de visée : il désigne l'objet sans le toucher. Il ne
            tourne que tant que personne n'a répondu à l'appel. */}
        <AnimatePresence>
          {!opened && (
            <motion.span
              key="reticle"
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 -z-1 block aspect-square w-[min(74vw,26rem)] rounded-full border border-[#ffd76a]/20"
              // Le centrage est confié à Motion, pas à des classes de
              // translation : dès qu'une échelle est animée, la transformation
              // en ligne remplace celle de la feuille de style, et l'anneau
              // partirait se coller en bas à droite du centre.
              style={{ x: "-50%", y: "-50%" }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{
                opacity: hovering ? 0.9 : 0.45,
                // La respiration de l'anneau est une animation JavaScript :
                // la règle CSS de mouvement réduit ne l'atteindrait pas.
                // C'est donc ici qu'on la coupe.
                scale: greeted || reduced ? 1 : [1, 1.045, 1],
              }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{
                opacity: { duration: 0.6 },
                scale:
                  greeted || reduced
                    ? { duration: 0.6 }
                    : { duration: 3.4, repeat: Infinity, ease: "easeInOut" },
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* --- La commande ----------------------------------------------
          Elle est sous l'objet, elle porte un verbe, et elle annonce ce
          qu'elle contient. Deux secondes suffisent à comprendre. */}
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="command"
            className="relative z-3 mt-8 flex flex-col items-center px-5 sm:mt-10"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <button
              type="button"
              onClick={requestOpen}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              data-cursor="hover"
              className="group relative inline-flex items-center gap-3 rounded-full border border-[#ffc529]/45 bg-[#ffc529]/[0.07] px-6 py-4 transition-colors duration-500 hover:border-[#ffd76a]/80 hover:bg-[#ffc529]/15 sm:px-7"
            >
              {/* La lueur qui respire : c'est elle qui dit « vivant ». */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 -z-1 rounded-full bg-[#ffc529]/25 blur-xl transition-opacity duration-700",
                  greeted
                    ? "opacity-0 group-hover:opacity-100"
                    : "animate-breathe opacity-90",
                )}
              />
              <span className="relative flex h-2 w-2 shrink-0">
                {!greeted && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#ffd76a] opacity-80" />
                )}
                <span className="relative h-2 w-2 rounded-full bg-[#ffd76a] shadow-[0_0_10px_1px_rgba(255,215,106,0.9)]" />
              </span>
              <span className="font-mono text-[0.6875rem] tracking-[0.26em] text-star uppercase">
                {callToAction}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#ffd76a] transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            {/* Ce qu'il y a derrière : annoncé, pas caché. */}
            <ul className="mt-5 flex items-center gap-4 sm:gap-6">
              {site.channels.map((channel) => (
                <li key={channel.id} className="flex items-center gap-2">
                  <span className="relative block h-5 w-5 shrink-0 sm:h-6 sm:w-6">
                    <Image
                      src={channel.artifactSmall}
                      alt=""
                      fill
                      sizes="24px"
                      className="object-contain opacity-80 mix-blend-screen"
                    />
                  </span>
                  <span className="font-mono text-[0.5625rem] tracking-[0.18em] text-dim uppercase">
                    {channel.label}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* La phrase. En bas, décalée à gauche, sans titre au-dessus. */}
      <div className="container-x relative z-2 mt-20 sm:mt-24">
        <div className="grid gap-10 lg:grid-cols-12">
          <motion.p
            className="type-safe max-w-xl font-display text-[clamp(1.65rem,4.4vw,3.4rem)] leading-[1.04] font-medium tracking-[-0.03em] text-star lg:col-span-7 lg:col-start-2"
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "0px 0px -18% 0px" }}
            transition={{ duration: 1.2, ease: EASE }}
          >
            On ne se raconte pas.{" "}
            <span className="text-dim">
              On vous montre ce qu&apos;on fabrique, le jour où on le fabrique.
            </span>
          </motion.p>

          <motion.div
            className="lg:col-span-3 lg:col-start-10 lg:pt-3"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: EASE }}
          >
            <div className="hairline" />
            <p className="mt-5 text-sm leading-relaxed text-dim">
              {primary.note} Aucun formulaire, aucune newsletter — juste le
              chantier tel qu&apos;il est.
            </p>
          </motion.div>
        </div>
      </div>

      {/* --- La révélation ------------------------------------------- */}
      <AnimatePresence>
        {opened && (
          <motion.div
            key="reveal"
            className="fixed inset-0 z-90 flex items-end justify-center overflow-y-auto overscroll-contain px-0 py-0 sm:items-center sm:px-5 sm:py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Canaux directs ${site.name}`}
            onClick={close}
          >
            {/* Le vide se referme derrière : on est encore dans l'univers. */}
            <div className="fixed inset-0 bg-void/85 backdrop-blur-2xl" />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none fixed top-1/3 left-1/2 h-[46rem] w-[46rem] max-w-[130vw] rounded-full bg-[#ffc529]/12 blur-[130px]"
              // Même raison que pour l'anneau : la translation de centrage
              // doit passer par Motion, sinon l'échelle animée l'efface.
              style={{ x: "-50%", y: "-50%" }}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.6, ease: EASE }}
            />

            <motion.div
              className="relative w-full max-w-3xl rounded-t-panel border-t border-edge/50 bg-void/60 px-4 pt-18 pb-10 xs:px-5 sm:rounded-panel sm:border-0 sm:bg-transparent sm:px-0 sm:pt-0 sm:pb-0"
              initial={{ opacity: 0, y: 40, rotateX: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.95, ease: EASE, delay: 0.08 }}
              style={{ transformPerspective: 1400 }}
              onClick={(event) => event.stopPropagation()}
            >
              {/*
                La poignée de fermeture se pose À GAUCHE au doigt.
                La jauge du HUD occupe en permanence le coin haut droit de
                l'écran ; une croix au même endroit, c'est une cible sur
                deux qui ouvre le journal de bord au lieu de fermer le
                panneau. Sur grand écran, la jauge est plus loin et la
                croix retrouve sa place, accrochée au coin du panneau.
              */}
              <button
                type="button"
                onClick={close}
                aria-label="Fermer le canal"
                autoFocus
                className="absolute top-4 left-4 z-3 flex h-11 w-11 items-center justify-center rounded-full border border-edge/70 bg-void/70 text-mist backdrop-blur-md transition-colors duration-300 hover:border-[#ffd76a]/60 hover:text-star sm:-top-3 sm:-right-3 sm:left-auto"
              >
                <Close className="h-4 w-4" />
              </button>

              {/* Le canal principal. */}
              <a
                href={primary.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group relative flex flex-col items-center gap-6 rounded-panel border border-[#ffc529]/25 bg-linear-to-b from-[#ffc529]/[0.07] to-transparent p-6 text-center sm:flex-row sm:gap-12 sm:p-12 sm:text-left"
              >
                <span className="relative block aspect-square w-28 shrink-0 xs:w-32 sm:w-52">
                  <span className="absolute inset-[-24%] rounded-full bg-[#ffc529]/22 blur-[54px] transition-all duration-700 group-hover:bg-[#ffc529]/34" />
                  {/* `screen` dissout le fond étoilé du rendu : l'artefact
                      flotte dans le vide du site au lieu d'y être collé. */}
                  <Image
                    src={primary.artifact}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 8rem, 13rem"
                    className="relative object-contain mix-blend-screen transition-transform duration-900 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  />
                </span>

                <span className="flex-1">
                  <span className="font-mono text-[0.625rem] tracking-[0.3em] text-[#ffd76a] uppercase">
                    Canal ouvert · {primary.label}
                  </span>
                  <span className="type-safe mt-3 block font-display text-[clamp(1.75rem,6vw,3.5rem)] leading-none font-medium tracking-tight text-star">
                    {primary.handle}
                  </span>
                  <span className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#ffc529]/40 bg-[#ffc529]/10 px-5 py-3 text-sm text-star sm:w-auto sm:justify-start">
                    Ajouter sur {primary.label}
                    <ArrowUpRight className="h-4 w-4 text-[#ffd76a] transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </span>
                </span>
              </a>

              {/* Les deux satellites. */}
              <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4">
                {satellites.map((channel, index) => (
                  <motion.a
                    key={channel.id}
                    href={channel.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-center gap-4 rounded-card border border-edge/60 bg-white/[0.02] p-4 transition-colors duration-500 hover:border-accent-soft/40 sm:gap-5 sm:p-5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.35 + index * 0.1, ease: EASE }}
                  >
                    <span className="relative block aspect-square w-12 shrink-0 sm:w-14">
                      <span className="absolute inset-[-30%] rounded-full bg-accent/18 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100" />
                      <Image
                        src={channel.artifactSmall}
                        alt=""
                        fill
                        sizes="3.5rem"
                        className="relative object-contain mix-blend-screen"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-star">
                        {channel.handle}
                      </span>
                      <span className="mt-1 block font-mono text-[0.5625rem] tracking-[0.2em] text-dim uppercase">
                        {channel.label} · {channel.promise}
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-dim transition-colors duration-500 group-hover:text-accent-soft" />
                  </motion.a>
                ))}
              </div>

              <button
                type="button"
                onClick={close}
                className="mx-auto mt-7 block font-mono text-[0.625rem] tracking-[0.28em] text-dim uppercase transition-colors duration-300 hover:text-star sm:mt-8"
              >
                Fermer le canal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
