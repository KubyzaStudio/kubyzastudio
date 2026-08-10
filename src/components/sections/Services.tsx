"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { services } from "@/data/services";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { Reveal } from "@/components/ui/Reveal";
import { useIsTouch } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import {
  IconAutomation,
  IconLanding,
  IconMaintenance,
  IconRefonte,
  IconSeo,
  IconSite,
  Plus,
} from "@/components/ui/Icons";

const ICONS = [
  IconSite,
  IconLanding,
  IconRefonte,
  IconSeo,
  IconMaintenance,
  IconAutomation,
];

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Le journal de bord des missions.
 * Une ligne par service ; le détail se déplie sans jamais quitter la page.
 */
export function Services() {
  const [open, setOpen] = useState<number | null>(0);
  const isTouch = useIsTouch();
  const baseId = useId();

  return (
    <section id="missions" className="relative isolate py-28 sm:py-40">
      <div className="container-x">
        {/* Le titre est rejeté sur la droite et le repère reste à gauche :
            la ligne d'en-tête traverse l'écran au lieu de s'empiler. */}
        <div className="flex flex-col gap-8 sm:flex-row sm:items-baseline sm:justify-between">
          <SectionMarker code="03" label="Nos missions" />
          <h2 className="type-safe max-w-lg font-display text-[clamp(1.9rem,4.6vw,3.6rem)] leading-[0.96] font-medium tracking-[-0.04em] text-star sm:text-right">
            Ce que nous mettons en orbite.
          </h2>
        </div>

        <ul className="mt-20 border-t border-edge/50 sm:mt-28">
        {services.map((service, index) => {
          const Icon = ICONS[index] ?? IconSite;
          const isOpen = open === index;
          const panelId = `${baseId}-panel-${index}`;

          return (
            <Reveal
              as="li"
              key={service.id}
              delay={index * 0.05}
              y={14}
              blur={false}
              className="group border-b border-edge/50"
            >
              <div
                onMouseEnter={() => !isTouch && setOpen(index)}
                className="relative"
              >
                {/* Lueur qui remplit la ligne active. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute inset-0 transition-opacity duration-700",
                    isOpen ? "opacity-100" : "opacity-0",
                  )}
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(61,107,255,0.12) 0%, transparent 55%)",
                  }}
                />

                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="relative flex w-full items-center gap-5 py-7 text-left sm:gap-8 sm:py-9"
                >
                  {/* Sur mobile, le code passe au-dessus : le titre garde
                      toute la largeur et cesse de se couper en deux. */}
                  <span className="hidden font-mono text-[0.6875rem] tracking-[0.18em] text-dim tabular-nums sm:block">
                    {service.code}
                  </span>

                  <span className="relative flex-1">
                    <span className="mb-2.5 block font-mono text-[0.625rem] tracking-[0.18em] text-dim tabular-nums sm:hidden">
                      {service.code}
                    </span>
                    <span
                      className={cn(
                        "block font-display text-[clamp(1.5rem,4.6vw,2.6rem)] leading-none font-medium tracking-tight transition-colors duration-500",
                        isOpen ? "text-star" : "text-mist group-hover:text-star",
                      )}
                    >
                      {service.title}
                    </span>
                  </span>

                  {/* Icône entourée de son orbite : elle tourne quand la ligne s'ouvre. */}
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center sm:h-14 sm:w-14">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-0 rounded-full border border-dashed transition-all duration-700",
                        isOpen
                          ? "border-accent-soft/45 opacity-100"
                          : "border-edge/60 opacity-40",
                      )}
                      style={
                        isOpen
                          ? { animation: "orbit 14s linear infinite" }
                          : undefined
                      }
                    />
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-colors duration-500 sm:h-6 sm:w-6",
                        isOpen ? "text-accent-soft" : "text-dim",
                      )}
                    />
                  </span>

                  <Plus
                    aria-hidden="true"
                    className={cn(
                      "hidden h-4 w-4 shrink-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] sm:block",
                      isOpen ? "rotate-135 text-accent-soft" : "text-dim",
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      key="panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.65, ease: EASE }}
                      className="relative overflow-hidden"
                    >
                      <div className="grid gap-6 pb-9 sm:grid-cols-12 sm:gap-10 sm:pl-[7.5rem]">
                        <div className="sm:col-span-6">
                          <p className="text-base leading-relaxed text-star/90">
                            {service.description}
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-dim">
                            {service.outcome}
                          </p>
                        </div>

                        <ul className="flex flex-wrap gap-2 sm:col-span-6 sm:content-start">
                          {service.includes.map((item) => (
                            <li
                              key={item}
                              className="rounded-full border border-edge/70 bg-white/[0.02] px-3.5 py-1.5 text-xs text-mist"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
        </ul>

        {/* La phrase arrive après la liste, jamais avant : on lit d'abord
            ce qui est proposé, on comprend ensuite comment ça marche. */}
        <Reveal delay={0.1} className="mt-14 max-w-md">
          <p className="text-sm leading-relaxed text-dim">
            Vous choisissez la trajectoire, nous nous occupons du décollage.
            Une mission peut en appeler une autre — rien n&apos;est figé.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
