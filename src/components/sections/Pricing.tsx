"use client";

import { motion } from "motion/react";
import { maintenance, planDelay, plans } from "@/data/pricing";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowUpRight } from "@/components/ui/Icons";
import { useMission } from "@/components/providers/MissionContext";
import { cn, formatEuro } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Chaque palier est plus haut et plus rentré que le précédent. */
const ASCENT = ["lg:ml-0", "lg:ml-[7%]", "lg:ml-[14%]"] as const;

/**
 * LES OFFRES
 * ==========================================================================
 * Trois cartes alignées côte à côte, c'est la grille de prix de tout le
 * monde — et c'est aussi ce qui force le visiteur à comparer six colonnes
 * de coches au lieu de choisir.
 *
 * GRAND ÉCRAN — les paliers montent : chaque offre est une rangée pleine
 * largeur, décalée vers la droite et vers le haut, avec son montant en très
 * grand. On lit une trajectoire, pas un comparateur.
 *
 * TÉLÉPHONE — la trajectoire ne veut plus rien dire : il n'y a pas de
 * largeur à traverser. Trois solutions étaient possibles ; voici pourquoi
 * c'est la troisième qui est ici.
 *
 *   · Défilement horizontal contrôlé — écarté : la page en contient déjà
 *     deux (les réalisations, les témoignages). Un troisième geste
 *     latéral au moment de choisir un prix, c'est cacher le prix.
 *   · Onglets — écartés : on ne compare pas trois offres qu'on ne peut pas
 *     voir en même temps. L'onglet oblige à mémoriser, donc à revenir.
 *   · Paliers verticaux pleine largeur — retenu. Chaque offre devient une
 *     carte fermée, avec sa propre respiration, dans l'ordre exact où on
 *     la lit : nom, promesse, MONTANT, ce qui est inclus, commande. Le
 *     montant remonte avant la liste parce que c'est lui qu'on vient
 *     chercher — sur mobile il ne peut plus être « à droite ».
 *
 * Rien n'est compressé : c'est une autre composition, pas la même en plus
 * petit. Le placement en grille de la version grand écran est déclaré
 * explicitement (`lg:col-start` / `lg:row-start`), ce qui laisse l'ordre
 * mobile entièrement libre.
 */
export function Pricing() {
  const { plan: selected, setBrief } = useMission();

  return (
    <section id="offres" className="relative isolate py-28 sm:py-40">
      <div className="container-x">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionMarker code="06" label="Les offres" />
          <p className="max-w-xs text-sm leading-relaxed text-dim lg:text-right">
            Des montants annoncés à l&apos;avance. Vous savez ce que vous payez
            avant que nous commencions.
          </p>
        </div>

        <h2 className="type-safe mt-12 max-w-3xl font-display text-[clamp(2rem,5.4vw,4.4rem)] leading-[0.94] font-medium tracking-[-0.045em] text-star sm:mt-16">
          Jusqu&apos;où voulez-vous
          <span className="text-dim"> aller ?</span>
        </h2>

        <ul className="mt-16 space-y-6 sm:mt-28 lg:space-y-0">
          {plans.map((plan, index) => {
            const isActive = selected === plan.name;
            return (
              <motion.li
                key={plan.id}
                className={cn("relative", ASCENT[index] ?? "")}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "0px 0px -12% 0px" }}
                transition={{ duration: 1, delay: index * 0.08, ease: EASE }}
              >
                {/* Carte fermée au doigt, rangée traversante au-delà. */}
                <div
                  className={cn(
                    "group relative overflow-hidden rounded-panel border border-edge/45 bg-linear-to-b from-white/[0.035] to-transparent px-6 py-9 transition-colors duration-700",
                    "lg:overflow-visible lg:rounded-none lg:border-0 lg:border-t lg:bg-none lg:px-0 lg:py-0",
                    index === plans.length - 1 && "lg:border-b",
                    plan.featured && "border-accent/45 lg:border-accent/35",
                  )}
                >
                  {/* La lueur d'orbite du palier retenu suit la sélection
                      faite plus haut dans le calculateur. */}
                  {isActive && (
                    <motion.span
                      layoutId="plan-orbit"
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-panel border border-accent-soft/50 bg-accent/[0.045] shadow-[0_0_60px_-14px_rgba(61,107,255,0.8)] lg:inset-x-[-1.5rem] lg:inset-y-0 lg:rounded-card"
                      transition={{ duration: 0.7, ease: EASE }}
                    />
                  )}

                  {plan.featured && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-accent-soft/80 via-accent-glow/50 to-transparent"
                    />
                  )}

                  <div className="relative grid gap-9 lg:grid-cols-12 lg:gap-10 lg:py-16">
                    {/* Identité du palier. */}
                    <div className="order-1 lg:order-none lg:col-span-4 lg:col-start-1 lg:row-span-2 lg:row-start-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[0.625rem] tracking-[0.2em] text-dim uppercase">
                          {plan.code}
                        </span>
                        {plan.featured && (
                          <span className="rounded-full border border-accent-soft/40 px-2.5 py-1 font-mono text-[0.5rem] tracking-[0.18em] text-accent-glow uppercase">
                            Le plus choisi
                          </span>
                        )}
                      </div>

                      <h3
                        className={cn(
                          // Le titre d'un palier ne se met pas en veille
                          // faute de souris : au doigt, les trois offres
                          // sont lisibles d'emblée, et c'est le survol qui
                          // réveille les paliers secondaires sur grand écran.
                          "type-safe mt-5 font-display leading-[1] font-medium tracking-[-0.03em] text-star transition-colors duration-500 lg:leading-[0.98] lg:tracking-[-0.035em]",
                          plan.featured
                            ? "text-[clamp(2rem,3.6vw,2.9rem)]"
                            : "text-[clamp(1.75rem,2.9vw,2.3rem)] lg:text-mist lg:group-hover:text-star",
                        )}
                      >
                        {plan.name}
                      </h3>
                      <p className="mt-3 max-w-xs text-sm leading-relaxed text-dim">
                        {plan.pitch}
                      </p>
                    </div>

                    {/* Le montant. C'est lui qu'on vient chercher — il passe
                        donc avant la liste au doigt, et retourne à droite
                        de la rangée sur grand écran. */}
                    <div className="order-2 border-y border-edge/40 py-6 lg:order-none lg:col-span-3 lg:col-start-10 lg:row-start-1 lg:border-0 lg:py-0 lg:text-right">
                      <span className="font-mono text-[0.5625rem] tracking-[0.2em] text-dim uppercase">
                        à partir de
                      </span>
                      <p
                        className={cn(
                          "type-safe mt-1 font-display leading-none font-medium tracking-[-0.04em] tabular-nums",
                          plan.featured
                            ? "type-luminous text-[clamp(3rem,13vw,4.5rem)]"
                            : "text-[clamp(2.5rem,11vw,3.4rem)] text-star",
                        )}
                      >
                        {formatEuro(plan.from)}
                      </p>
                      <p className="mt-2 font-mono text-[0.5625rem] tracking-[0.16em] text-dim uppercase">
                        Livré en {planDelay(plan)}
                      </p>
                    </div>

                    {/* Ce qui est inclus — en colonnes de texte, sans coches
                        ni pastilles : une liste se lit, elle ne se coche pas.
                        Une seule colonne au doigt : deux colonnes de 130 px
                        coupaient les intitulés en trois lignes. */}
                    <ul className="order-3 columns-1 gap-x-8 lg:order-none lg:col-span-5 lg:col-start-5 lg:row-span-2 lg:row-start-1 lg:columns-2">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="mb-3 break-inside-avoid text-sm leading-relaxed text-mist lg:mb-2.5"
                        >
                          <span
                            aria-hidden="true"
                            className="mr-2.5 inline-block h-px w-3 translate-y-[-0.25em] bg-accent/60 align-middle"
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* La commande. Pleine largeur et vraie cible tactile au
                        doigt (56 px de haut) ; redevient un simple trait
                        souligné en bas de colonne sur grand écran. */}
                    <div className="order-4 lg:order-none lg:col-span-3 lg:col-start-10 lg:row-start-2 lg:self-end lg:justify-self-end">
                      <a
                        href="#contact"
                        onClick={() => setBrief({ plan: plan.name })}
                        className={cn(
                          "flex w-full items-center justify-center gap-2.5 rounded-full border px-6 py-4 text-sm transition-colors duration-500",
                          "lg:w-auto lg:justify-end lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-0",
                          plan.featured
                            ? "border-accent-soft/50 bg-accent/12 text-star lg:border-0"
                            : "border-edge/70 text-mist hover:border-accent-soft/50 hover:text-star lg:border-0",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "hidden h-px transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:block",
                            plan.featured
                              ? "w-10 bg-accent-soft"
                              : "w-6 bg-edge group-hover:w-10 group-hover:bg-accent-soft",
                          )}
                        />
                        {plan.cta}
                        <ArrowUpRight className="h-3.5 w-3.5 text-accent-soft" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>

        {/* Le suivi : une note en marge, pas un quatrième palier. */}
        <Reveal delay={0.1} className="mt-16 lg:ml-[14%]">
          <div className="flex flex-col gap-6 border-l border-accent/30 py-2 pl-6 sm:flex-row sm:items-baseline sm:justify-between sm:gap-10">
            <div className="max-w-xl">
              <span className="font-mono text-[0.5625rem] tracking-[0.24em] text-accent-soft uppercase">
                Option · {maintenance.name}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-mist">
                {maintenance.description}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-dim">
                {maintenance.features.join(" · ")}
              </p>
            </div>
            <p className="shrink-0 font-display text-2xl font-medium tracking-tight text-star tabular-nums sm:text-3xl">
              {formatEuro(maintenance.price)}
              <span className="ml-2 font-mono text-[0.5625rem] tracking-[0.16em] text-dim uppercase">
                / mois
              </span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
