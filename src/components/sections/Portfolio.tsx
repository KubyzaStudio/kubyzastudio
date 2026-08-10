"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  PHASES,
  featuredProject,
  projects,
  upcomingProjects,
  type Project,
} from "@/data/projects";
import { MissionScene } from "@/components/ui/MissionScene";
import { MissionPhase } from "@/components/ui/MissionPhase";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { Button } from "@/components/ui/Button";
import { ArrowUpRight, Close } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * LE POSTE DE COMMANDE
 * ==========================================================================
 * La section ne présente pas quatre projets : elle raconte une progression.
 *
 *   MISSION 001 — accomplie. Le site est en ligne, on peut y aller.
 *   MISSIONS 002 / 003 — en cours. Construites, pas encore publiées.
 *   MISSION 004 — à venir. Rien n'est dessiné, et le décor le dit.
 *
 * D'où la coupure en deux : la mission accomplie occupe seule le haut de la
 * section — c'est la preuve, elle ne se met pas en rang. Les suivantes
 * partagent une rangée que l'on tire à la main.
 *
 * RÈGLE ABSOLUE — le bouton « Visiter le site » n'est rendu que lorsque
 * `href` existe. Une mission sans lien affiche son état, jamais une action
 * qui n'aboutit nulle part : il n'y a pas d'`href` de repli dans ce fichier.
 */
export function Portfolio() {
  const [active, setActive] = useState<Project | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    document.documentElement.style.overflow = active ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active, close]);

  // Glisser-déposer à la souris. Le défilement natif reste disponible
  // (trackpad, doigt, clavier) — on ne fait qu'ajouter le geste.
  useEffect(() => {
    const el = rail.current;
    if (!el) return;

    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let moved = 0;

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      dragging = true;
      moved = 0;
      startX = event.clientX;
      startScroll = el.scrollLeft;
      el.setPointerCapture(event.pointerId);
      el.dataset.dragging = "true";
    };

    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      const delta = event.clientX - startX;
      moved = Math.max(moved, Math.abs(delta));
      el.scrollLeft = startScroll - delta;
    };

    const onUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.releasePointerCapture(event.pointerId);
      delete el.dataset.dragging;
      // Un glissement franc ne doit pas se terminer par l'ouverture
      // du projet sur lequel le doigt s'est arrêté.
      if (moved > 8) {
        const swallow = (e: Event) => e.stopPropagation();
        el.addEventListener("click", swallow, { capture: true, once: true });
        window.setTimeout(
          () => el.removeEventListener("click", swallow, { capture: true }),
          0,
        );
      }
    };

    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section id="realisations" className="relative isolate py-28 sm:py-40">
      <div className="container-x flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <SectionMarker code="04" label="Réalisations" />
        <h2 className="type-safe max-w-md font-display text-[clamp(1.9rem,4.6vw,3.6rem)] leading-[0.96] font-medium tracking-[-0.04em] text-star sm:text-right">
          Un monde en orbite.
          <span className="text-dim"> Trois en approche.</span>
        </h2>
      </div>

      {/* ==================================================================
          MISSION ACCOMPLIE — la preuve, seule et en grand.
          ================================================================== */}
      <FeaturedMission project={featuredProject} onOpen={setActive} />

      {/* ==================================================================
          LA SUITE — ce qui est en construction, puis ce qui viendra.
          ================================================================== */}
      <div className="container-x mt-24 flex flex-col gap-3 sm:mt-32 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="label-mono text-accent-soft">En construction</span>
          <p className="type-safe mt-3 max-w-lg font-display text-[clamp(1.4rem,3vw,2.1rem)] leading-tight font-medium tracking-[-0.03em] text-star">
            Voici ce qui est en train d&apos;être construit.
          </p>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-dim sm:text-right">
          Ces sites existent. Aucun n&apos;est encore publié — vous ne verrez
          donc rien d&apos;autre ici que leur mission.
        </p>
      </div>

      <div
        ref={rail}
        className="mt-12 flex snap-none items-start gap-6 overflow-x-auto overscroll-x-contain pt-4 pb-14 pl-5 sm:mt-16 sm:gap-12 sm:pt-10 sm:pb-24 sm:pl-10 lg:pl-16 [&::-webkit-scrollbar]:hidden [&[data-dragging]]:cursor-grabbing"
        style={{ scrollbarWidth: "none" }}
        role="list"
        aria-label="Missions en cours et à venir"
      >
        {upcomingProjects.map((project, index) => (
          <MissionCard
            key={project.id}
            project={project}
            index={index}
            onOpen={setActive}
          />
        ))}

        {/* Fin de rangée : l'invitation qui prolonge la lecture. Elle porte
            son propre fond, sinon la planète du décor 3D passe dessous et
            la phrase devient illisible en fin de course. */}
        <div className="relative flex w-[62vw] shrink-0 flex-col justify-center pr-10 sm:w-[24rem] sm:pt-20 lg:pr-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-6 -inset-y-8 -z-1 rounded-panel bg-void/70 blur-xl"
          />
          {/* Pas de numéro ici : la section Services occupe déjà la
              numérotation courte (MISSION 01 à 06), et deux séries de
              numéros dans la même page se liraient comme une seule. */}
          <p className="relative max-w-[26ch] font-display text-xl leading-snug text-mist sm:text-2xl">
            La mission suivante n&apos;a pas encore de nom.
          </p>
          {/* `py-3` n'est pas décoratif : sans lui le lien ne fait que 20 px
              de haut, soit moitié moins que la cible tactile tenable au
              pouce. La marge négative garde l'alignement optique du texte. */}
          <a
            href="#contact"
            className="group relative -my-3 mt-4 inline-flex items-center gap-3 py-3 text-sm text-star"
          >
            <span
              aria-hidden="true"
              className="block h-px w-8 bg-accent-soft transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-14"
            />
            En parler
          </a>
        </div>
      </div>

      {/* La jauge de rangée. Elle remplace la barre de défilement.
          Au doigt, le bouton flottant du HUD occupe le bas de l'écran :
          la jauge réserve donc la hauteur nécessaire pour ne pas se lire
          au travers de lui. */}
      <div className="container-x flex items-center gap-5 pb-14 sm:pb-0">
        <div className="h-px w-full max-w-xs bg-edge/50">
          <div
            className="h-full bg-accent-soft shadow-[0_0_8px_0_rgba(110,151,255,0.8)] transition-[width] duration-150 ease-linear"
            style={{ width: `${Math.max(6, progress * 100)}%` }}
          />
        </div>
        {/* Le geste n'a pas le même nom selon qu'on ait une souris ou un
            doigt : on tire une rangée, on fait glisser un écran. */}
        <span className="font-mono text-[0.5625rem] tracking-[0.22em] text-dim uppercase">
          <span className="[@media(hover:none)]:hidden">Tirez la rangée</span>
          <span className="hidden [@media(hover:none)]:inline">
            Faites glisser
          </span>
        </span>
      </div>

      <AnimatePresence>
        {active && <MissionBriefing project={active} onClose={close} />}
      </AnimatePresence>
    </section>
  );
}

/* ==========================================================================
   LA MISSION ACCOMPLIE
   Le seul bloc qui montre un vrai site, parce que c'est le seul qui en a un.
   ========================================================================== */
function FeaturedMission({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: (p: Project) => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <motion.div
      className="container-x mt-14 sm:mt-24"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px -10% 0px -10%" }}
      transition={{ duration: 1, ease: EASE }}
    >
      <span className="label-mono text-accent-glow">
        Notre première réalisation en ligne
      </span>

      <div
        className="glass mt-6 overflow-hidden rounded-panel"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div className="grid items-center gap-0 lg:grid-cols-12">
          {/* Le vrai site, cadré large. Aucune invention : c'est la page
              d'accueil telle qu'elle est publiée. */}
          <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9] lg:col-span-7 lg:aspect-auto lg:h-full lg:min-h-[26rem]">
            {project.wideImage && (
              <Image
                src={project.wideImage}
                alt={`Page d'accueil du site ${project.name}`}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className={cn(
                  "object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                  hover ? "scale-[1.04]" : "scale-100",
                )}
                priority
              />
            )}
            {/* Le fondu qui raccorde la capture au vide de la page. */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void via-void/25 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-void/20 lg:to-void" />

            <span className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full border border-accent-soft/40 bg-void/70 px-3 py-1.5 backdrop-blur-md">
              <MissionPhase phase={project.phase} variant="code" />
            </span>
          </div>

          <div className="relative p-6 pt-2 sm:p-10 lg:col-span-5 lg:py-12">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[0.5625rem] tracking-[0.22em] text-dim tabular-nums">
                MISSION {project.mission}
              </span>
              <span aria-hidden="true" className="h-px flex-1 bg-edge/60" />
              <span className="font-mono text-[0.5625rem] text-dim tabular-nums">
                {project.year}
              </span>
            </div>

            <h3 className="type-safe mt-5 font-display text-[clamp(1.8rem,5.5vw,2.6rem)] leading-[1.02] font-medium tracking-[-0.03em] text-star">
              {project.name}
            </h3>
            <span className="label-mono mt-3 block">{project.sector}</span>

            <p className="mt-5 text-sm leading-relaxed text-mist">
              {project.teaser} Douze prestations, une galerie de chantiers
              avant / après et six départements couverts.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {/* Le seul lien sortant de la section — et il n'existe que
                  parce que `href` existe. Aucun repli n'est prévu : une
                  mission sans site n'affiche pas ce bouton du tout. */}
              {project.href && (
                <Button
                  href={project.href}
                  size="sm"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Visiter le site
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpen(project)}
              >
                Détail de la mission
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ==========================================================================
   UNE MISSION EN COURS OU À VENIR
   Pas de lien, pas d'aperçu : un décor, un numéro, un état.
   ========================================================================== */
function MissionCard({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: (p: Project) => void;
}) {
  const card = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [centered, setCentered] = useState(false);

  /*
    Au doigt, il n'y a pas de survol : c'est la carte amenée au centre de
    l'écran qui devient active. La bande observée est réduite au tiers
    central de la fenêtre — une seule carte peut y être à la fois.
  */
  useEffect(() => {
    const el = card.current;
    if (!el) return;
    if (!window.matchMedia("(hover: none)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => setCentered(entry.isIntersecting),
      { rootMargin: "-20% -33% -20% -33%" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const active = hover || centered;
  const phase = PHASES[project.phase];

  return (
    <motion.div
      ref={card}
      role="listitem"
      className="w-[74vw] shrink-0 xs:w-[68vw] sm:w-[22rem] lg:w-[24rem]"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px -10% 0px -10%" }}
      transition={{ duration: 1, delay: index * 0.08, ease: EASE }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type="button"
        onClick={() => onOpen(project)}
        className="group block w-full text-left"
        aria-label={`Détail de la mission ${project.name}`}
      >
        <div
          className={cn(
            "relative aspect-square w-full transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]",
            active && "scale-[1.03]",
          )}
        >
          <MissionScene
            project={project}
            active={active}
            className="h-full w-full"
          />

          {/* Le numéro de mission, gravé dans la scène. */}
          <span
            aria-hidden="true"
            className="absolute top-0 left-0 font-mono text-[0.5625rem] tracking-[0.22em] text-dim tabular-nums"
          >
            MISSION {project.mission}
          </span>

          {/* Les informations de mission — elles montent quand la scène
              devient active, et restent lisibles quand elle ne l'est pas. */}
          <div
            className={cn(
              "absolute right-0 bottom-0 left-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
              active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-edge/70 bg-void/70 px-3 py-1.5 backdrop-blur-md">
              <span className="font-mono text-[0.5625rem] tracking-[0.2em] text-mist uppercase">
                {phase.statement}
              </span>
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-baseline justify-between gap-4">
          <span
            className={cn(
              "font-display text-lg leading-tight font-medium transition-colors duration-500 sm:text-xl",
              active ? "text-accent-glow" : "text-star",
            )}
          >
            {project.name}
          </span>
          <span className="shrink-0 font-mono text-[0.5625rem] text-dim tabular-nums">
            {project.year}
          </span>
        </div>

        <span className="mt-2 block font-mono text-[0.5625rem] tracking-[0.2em] text-dim uppercase">
          {project.sector}
        </span>

        <span className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <MissionPhase phase={project.phase} variant="code" />
          {/* À la place du bouton de visite : l'état, qui ne mène nulle part
              parce qu'il n'y a nulle part où aller. */}
          <span className="font-mono text-[0.5625rem] tracking-[0.2em] text-dim uppercase">
            {phase.standby}
          </span>
        </span>
      </button>
    </motion.div>
  );
}

/* ==========================================================================
   LA FICHE DE MISSION
   ========================================================================== */
function MissionBriefing({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const phase = PHASES[project.phase];

  return (
    <motion.div
      key="project-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-title"
      className="fixed inset-0 z-90 flex items-end justify-center overflow-y-auto bg-void/88 backdrop-blur-2xl sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      onClick={onClose}
    >
      <motion.article
        className="glass relative my-0 w-full max-w-4xl overflow-hidden rounded-t-panel p-6 pt-20 sm:my-10 sm:rounded-panel sm:p-12"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          autoFocus
          aria-label="Fermer"
          // À gauche au doigt : le coin haut droit appartient déjà à
          // la jauge du HUD, qui reste au-dessus de la fiche.
          className="absolute top-5 left-5 z-2 flex h-11 w-11 items-center justify-center rounded-full border border-edge/70 bg-void/60 text-mist backdrop-blur-md transition-colors duration-300 hover:border-accent-soft/60 hover:text-star sm:top-7 sm:right-7 sm:left-auto sm:h-10 sm:w-10 sm:bg-transparent"
        >
          <Close className="h-4 w-4" />
        </button>

        <div className="grid gap-10 sm:grid-cols-12 sm:gap-12">
          <div className="flex justify-center sm:col-span-5 sm:justify-start">
            <div className="relative aspect-square w-44 sm:w-full sm:max-w-[16rem]">
              <MissionScene
                project={project}
                active
                className="h-full w-full"
              />
            </div>
          </div>

          <div className="sm:col-span-7">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <MissionPhase phase={project.phase} variant="code" />
              <span className="font-mono text-[0.5625rem] tracking-[0.22em] text-dim tabular-nums">
                MISSION {project.mission}
              </span>
            </div>

            <span className="label-mono mt-4 block">{project.category}</span>
            <h3
              id="project-title"
              className="type-safe mt-3 font-display text-3xl leading-none font-medium tracking-tight text-star sm:text-4xl"
            >
              {project.name}
            </h3>

            <p className="mt-6 text-sm leading-relaxed text-mist sm:text-base">
              {project.description}
            </p>

            {/* Ce que contient la mission — jamais un résultat
                commercial : uniquement ce qui est vérifiable. */}
            <div className="mt-7 rounded-card border border-edge/60 bg-white/[0.02] p-5">
              <span className="font-mono text-[0.625rem] tracking-[0.2em] text-accent-soft uppercase">
                {phase.scopeLabel}
              </span>
              <ul className="mt-3 space-y-2">
                {project.scope.map((line) => (
                  <li key={line} className="text-sm leading-relaxed text-star/90">
                    <span
                      aria-hidden="true"
                      className="mr-2.5 inline-block h-px w-3 translate-y-[-0.25em] bg-accent/60 align-middle"
                    />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <ul className="mt-7 flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <li
                  key={tech}
                  className="rounded-full border border-edge/70 px-3 py-1.5 text-xs text-mist"
                >
                  {tech}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              {project.href ? (
                <Button
                  href={project.href}
                  size="sm"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Visiter le site
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              ) : (
                // Pas de site à visiter : on le dit, on ne le simule pas.
                <span className="inline-flex items-center gap-2.5 rounded-full border border-edge/70 px-4 py-2.5">
                  <MissionPhase phase={project.phase} />
                </span>
              )}
              <Button
                href="#contact"
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Un projet similaire ?
              </Button>
            </div>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}

/** Garde-fou de développement : la rangée doit montrer les quatre missions. */
if (process.env.NODE_ENV !== "production" && projects.length !== 4) {
  console.warn(
    `[Portfolio] ${projects.length} mission(s) dans les données, 4 attendues.`,
  );
}
