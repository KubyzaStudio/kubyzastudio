"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { problems, benefits, comparison } from "@/data/content";
import { useIsTouch, usePrefersReducedMotion } from "@/lib/hooks";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Chaque constat a sa propre mise en page. Aucune n'est réutilisée.
 * C'est le seul moyen d'éviter que quatre idées différentes finissent
 * dans quatre cartes identiques.
 */
const LAYOUTS = [
  "items-start justify-start text-left",
  "items-end justify-center text-right",
  "items-start justify-end text-left",
  "items-end justify-start text-right",
] as const;

/**
 * OÙ SE POSE LE CHIFFRE FANTÔME
 * ==========================================================================
 * Il était calé au centre exact du panneau — `items-center justify-center` —
 * quelle que soit la mise en page du texte. Or `LAYOUTS` déplace le texte
 * d'un panneau à l'autre, et le deuxième (`items-end justify-center`, celui
 * qui porte le « 02 ») est précisément celui dont le bloc est centré
 * verticalement. Les deux se posaient donc au même endroit : le texte,
 * opaque, traversait le chiffre en son milieu et le donnait à lire en
 * morceaux.
 *
 * Le chiffre est maintenant renvoyé dans la zone que le texte laisse libre,
 * en diagonale — texte en haut à gauche, chiffre en bas à droite, et ainsi
 * de suite. Rien n'a changé d'autre : ni sa taille, ni son opacité de
 * 2,2 %, ni le fait qu'il reste derrière tout le contenu. La composition y
 * gagne même l'équilibre en diagonale qu'elle cherchait déjà.
 *
 * L'ordre suit `LAYOUTS` index par index : les deux tableaux se lisent
 * ensemble, et modifier l'un sans l'autre ramènerait la superposition.
 */
const GHOST_PLACEMENTS = [
  // 0 · texte en haut à gauche  → chiffre en bas à droite
  "items-end justify-end pr-[7%] pb-[6%]",
  // 1 · texte centré à droite   → chiffre en bas à gauche
  "items-end justify-start pl-[5%] pb-[6%]",
  // 2 · texte en bas à gauche   → chiffre en haut à droite
  "items-start justify-end pt-[6%] pr-[7%]",
  // 3 · texte en haut à droite  → chiffre en bas à gauche
  "items-end justify-start pl-[5%] pb-[6%]",
] as const;

function Panel({
  index,
  code,
  signal,
  title,
  description,
  horizontal,
}: {
  index: number;
  code: string;
  signal: string;
  title: string;
  description: string;
  /** Piste horizontale épinglée, ou colonne au doigt. */
  horizontal: boolean;
}) {
  return (
    <article
      className={cn(
        "relative flex flex-col border-l border-edge/25",
        horizontal
          ? // Chaque panneau est une page à lui seul : il occupe la
            // largeur qu'il traverse.
            [
              "h-full w-[86vw] shrink-0 px-7 py-16 sm:w-[62vw] sm:px-14 lg:w-[46vw] lg:px-20",
              LAYOUTS[index % LAYOUTS.length],
            ]
          : // En colonne, une largeur en `vw` n'a plus aucun sens : elle
            // ne ferait que rétrécir le texte au milieu de l'écran. Et
            // l'alternance gauche/droite héritée de la piste devient un
            // ferrage arbitraire — tout revient à gauche, comme le reste
            // de la page.
            "w-full items-start justify-start px-5 py-10 text-left",
      )}
    >
      {/* Le chiffre fantôme : il donne la profondeur du panneau sans
          ajouter un seul mot. Calé sur la hauteur de l'écran en piste,
          sur celle du panneau en colonne.

          Il reste le premier enfant de l'article, donc peint avant le texte :
          c'est l'ordre du DOM qui garantit qu'il passe DERRIÈRE, sans avoir
          à inventer un `z-index`. En ajouter un ici créerait un contexte
          d'empilement de plus à tenir dans une section déjà épinglée par
          ScrollTrigger — le rang naturel est plus sûr. */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 flex font-display leading-none font-medium text-white/[0.022] select-none",
          horizontal
            ? ["text-[36vh]", GHOST_PLACEMENTS[index % GHOST_PLACEMENTS.length]]
            : // En colonne, le texte part toujours du haut à gauche. Le
              // chiffre était calé à droite et centré verticalement : il
              // croisait donc le titre, l'élément le plus dense du panneau.
              // Il descend au pied du bloc, derrière la fin du paragraphe —
              // du texte fin et en `text-mist`, qui laisse la forme du
              // chiffre lisible. Sur 320 px de large, la séparation ne peut
              // être que verticale : il n'y a pas de place pour deux
              // colonnes. Taille inchangée.
              "items-end justify-end pr-4 text-[7rem] xs:text-[9rem]",
        )}
      >
        {code}
      </span>

      {/* `relative` suffit à poser le texte au-dessus du chiffre : un élément
          positionné est peint après un élément statique de même rang. */}
      <div className="relative max-w-md">
        <div className="flex items-center gap-2.5">
          <span className="h-1 w-1 rounded-full bg-[#ff8fa3] shadow-[0_0_8px_1px_rgba(255,143,163,0.7)]" />
          <span className="font-mono text-[0.5625rem] tracking-[0.26em] text-[#ff8fa3]/90 uppercase">
            {signal}
          </span>
        </div>

        <h3 className="type-safe mt-7 font-display text-[clamp(1.75rem,3.6vw,3.1rem)] leading-[0.98] font-medium tracking-[-0.035em] text-star">
          {title}
        </h3>

        <p className="mt-5 text-sm leading-relaxed text-mist sm:text-base">
          {description}
        </p>
      </div>
    </article>
  );
}

/**
 * LE CONSTAT
 * ==========================================================================
 * La rupture de rythme de la page.
 *
 * Ici, le scroll vertical se transforme en déplacement horizontal : la
 * section se fige, et les constats défilent latéralement pendant que le
 * décor continue d'avancer en profondeur. Deux axes de mouvement en même
 * temps — c'est ce croisement qui produit l'effet, pas une animation de
 * plus sur un empilement de cartes.
 *
 * Au doigt ou en mouvement réduit, la piste redevient une colonne :
 * un défilement horizontal forcé sur un écran tactile est une faute.
 */
export function Transmission() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const isTouch = useIsTouch();
  const reduced = usePrefersReducedMotion();
  const horizontal = !isTouch && !reduced;

  useEffect(() => {
    if (!horizontal || !root.current || !track.current) return;

    let disposed = false;
    let dispose = () => {};

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed || !root.current || !track.current) return;

      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        // La distance à parcourir est recalculée à chaque `refresh` :
        // une police qui finit de charger change la largeur de la piste.
        const distance = () =>
          Math.max(0, (track.current?.scrollWidth ?? 0) - window.innerWidth);

        gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
      }, root);

      // Space Grotesk arrive après le premier rendu et élargit la piste.
      // Sans cette remesure, la fin de la séquence reste hors d'atteinte :
      // le défilement se déverrouille avant le dernier panneau.
      void document.fonts?.ready.then(() => {
        if (!disposed) ScrollTrigger.refresh();
      });

      dispose = () => ctx.revert();
    })();

    return () => {
      disposed = true;
      dispose();
    };
  }, [horizontal]);

  return (
    <section id="constat" className="relative isolate">
      <div
        ref={root}
        className={cn(
          "relative",
          horizontal ? "h-[100svh] overflow-hidden" : "py-24 sm:py-32",
        )}
      >
        <div
          ref={track}
          className={cn(
            horizontal
              ? "flex h-full items-stretch will-change-transform"
              : "flex flex-col gap-16",
          )}
        >
          {/* Ouverture — pleine largeur d'écran, rien d'autre dedans. */}
          <div
            className={cn(
              "flex shrink-0 flex-col justify-center px-5 md:px-10 lg:px-16",
              horizontal ? "h-full w-screen" : "w-full pb-4",
            )}
          >
            <SectionMarker code="02" label="Constat" />

            <motion.h2
              className="type-safe mt-10 max-w-4xl font-display text-[clamp(2.2rem,7vw,5.5rem)] leading-[0.92] font-medium tracking-[-0.045em] text-star"
              initial={{ opacity: 0, y: 28, filter: "blur(12px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "0px 0px -15% 0px" }}
              transition={{ duration: 1.3, ease: EASE }}
            >
              Votre activité existe.
              <br />
              <span className="text-dim">Mais est-elle visible ?</span>
            </motion.h2>

            <motion.p
              className="mt-9 max-w-md text-base leading-relaxed text-mist"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, delay: 0.3 }}
            >
              Chaque jour, des clients cherchent exactement ce que vous faites.
              La plupart ne vous trouveront jamais.
            </motion.p>

            {horizontal && (
              <div
                aria-hidden="true"
                className="mt-14 flex items-center gap-3 text-dim"
              >
                <span className="font-mono text-[0.5625rem] tracking-[0.26em] uppercase">
                  Continuez de défiler
                </span>
                <span className="block h-px w-16 bg-linear-to-r from-edge to-transparent" />
              </div>
            )}
          </div>

          {problems.map((problem, index) => (
            <Panel
              key={problem.code}
              index={index}
              code={problem.code}
              signal={problem.signal}
              title={problem.title}
              description={problem.description}
              horizontal={horizontal}
            />
          ))}

          {/* La bascule. Le seul panneau clair de toute la séquence. */}
          <div
            className={cn(
              "relative flex shrink-0 flex-col justify-center border-l border-edge/25",
              horizontal
                ? "h-full w-[92vw] px-7 py-16 sm:px-14 lg:w-[64vw] lg:px-24"
                : "w-full px-5 py-12",
            )}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-0 h-[34rem] w-[34rem] max-w-full -translate-y-1/2 rounded-full bg-accent/12 blur-[110px]"
            />

            <div className="relative">
              <span className="label-mono">La bascule</span>
              <h3 className="type-safe mt-6 max-w-2xl font-display text-[clamp(2rem,5.2vw,4.2rem)] leading-[0.94] font-medium tracking-[-0.04em] text-star">
                Il existe une solution, et elle vous appartient.
              </h3>

              {/* Les bénéfices en ligne de texte, pas en cartes :
                  quatre affirmations, une par ligne, et c'est tout. */}
              <ul className="mt-12 max-w-2xl">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={benefit.code}
                    className="group flex items-baseline gap-5 border-t border-edge/35 py-5 last:border-b sm:gap-8"
                    initial={{ opacity: 0, x: -18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: index * 0.08, ease: EASE }}
                  >
                    <span className="font-mono text-[0.625rem] text-accent-soft/70 tabular-nums">
                      {benefit.code}
                    </span>
                    <span className="flex-1">
                      <span className="block font-display text-lg leading-tight font-medium text-star sm:text-xl">
                        {benefit.title}
                      </span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-dim">
                        {benefit.description}
                      </span>
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/*
        L'arbitrage réseaux sociaux / site. Il appartient au constat, pas à
        une section à part : c'est la même question posée autrement.
        Un tableau à deux colonnes, sans bordures — la lecture se fait par
        l'alignement, pas par des cases.
      */}
      <div className="container-x relative py-28 sm:py-40">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h3 className="type-safe font-display text-[clamp(1.6rem,3.4vw,2.6rem)] leading-[1] font-medium tracking-[-0.03em] text-star">
              Une page de réseau social
              <br />
              n&apos;est pas une adresse.
            </h3>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-dim">
              Elle est prêtée. Un site vous appartient. La nuance se voit le
              jour où la plateforme change de règles.
            </p>
          </div>

          <div className="lg:col-span-8">
            <div className="mb-4 grid grid-cols-[1fr_1fr] gap-6 pl-0 sm:grid-cols-[minmax(0,10rem)_1fr_1fr] sm:gap-10">
              <span className="hidden sm:block" />
              <span className="font-mono text-[0.5625rem] tracking-[0.24em] text-dim uppercase">
                Réseau social
              </span>
              <span className="font-mono text-[0.5625rem] tracking-[0.24em] text-accent-soft uppercase">
                Votre site
              </span>
            </div>

            <ul>
              {comparison.map((row, index) => (
                <motion.li
                  key={row.criterion}
                  className="grid grid-cols-[1fr_1fr] gap-6 border-t border-edge/30 py-6 last:border-b sm:grid-cols-[minmax(0,10rem)_1fr_1fr] sm:gap-10"
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                  transition={{ duration: 0.8, delay: index * 0.06, ease: EASE }}
                >
                  <span className="col-span-2 font-mono text-[0.625rem] tracking-[0.14em] text-star uppercase sm:col-span-1 sm:normal-case sm:tracking-normal sm:font-sans sm:text-sm">
                    {row.criterion}
                  </span>
                  <span className="text-sm leading-relaxed text-dim">
                    {row.social}
                  </span>
                  <span className="text-sm leading-relaxed text-star/90">
                    {row.website}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
