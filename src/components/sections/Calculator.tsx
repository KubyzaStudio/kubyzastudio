"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CALCULATOR_DEFAULTS,
  calculatorSteps,
  estimateMission,
  type CalcOption,
} from "@/data/calculator";
import { maintenance } from "@/data/pricing";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { Reveal } from "@/components/ui/Reveal";
import { Counter } from "@/components/ui/Counter";
import { Button } from "@/components/ui/Button";
import { ArrowUpRight, Check } from "@/components/ui/Icons";
import { useMission } from "@/components/providers/MissionContext";
import { cn, formatEuro } from "@/lib/utils";

type Answers = Record<string, string[]>;

export function Calculator() {
  const [answers, setAnswers] = useState<Answers>(CALCULATOR_DEFAULTS);
  const { setBrief } = useMission();

  const toggle = (stepId: string, option: CalcOption, multiple?: boolean) => {
    setAnswers((prev) => {
      const current = prev[stepId] ?? [];
      if (multiple) {
        return {
          ...prev,
          [stepId]: current.includes(option.id)
            ? current.filter((id) => id !== option.id)
            : [...current, option.id],
        };
      }
      return { ...prev, [stepId]: [option.id] };
    });
  };

  const result = useMemo(() => estimateMission(answers), [answers]);

  /*
    La mission recommandée est reversée dans la mémoire du parcours : la
    section des offres allume alors le palier correspondant, et le
    formulaire de contact le reprend. Le visiteur ne redit jamais deux
    fois la même chose.
  */
  useEffect(() => {
    setBrief({ plan: result.plan.name });
  }, [result.plan.name, setBrief]);

  const sendToForm = () => {
    setBrief({
      plan: result.plan.name,
      summary: result.chosen.join(" · "),
      estimate: [result.low, result.high],
    });
  };

  return (
    <section id="estimation" className="relative isolate py-28 sm:py-40">
      <div className="container-x">
        {/* La console d'estimation : le repère, puis directement l'outil.
            Aucun paragraphe d'introduction — l'outil s'explique seul. */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionMarker code="07" label="Console de mission" />
          <h2 className="type-safe max-w-lg font-display text-[clamp(1.8rem,4.2vw,3.2rem)] leading-[0.96] font-medium tracking-[-0.04em] text-star lg:text-right">
            Configurez votre mission,
            <span className="text-dim"> lisez sa trajectoire.</span>
          </h2>
        </div>

      <Reveal className="mt-16 sm:mt-20">
        <div className="glass overflow-hidden rounded-panel">
          {/* Bandeau de contrôle. */}
          <div className="flex items-center justify-between border-b border-edge/50 bg-void/50 px-6 py-4 sm:px-9">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-accent-soft opacity-60" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-accent-soft" />
              </span>
              <span className="font-mono text-[0.5625rem] tracking-[0.22em] text-mist uppercase sm:text-[0.625rem]">
                Console de mission
              </span>
            </div>
            <span className="font-mono text-[0.5625rem] tracking-[0.22em] text-dim uppercase sm:text-[0.625rem]">
              KBZ · 77
            </span>
          </div>

          <div className="grid lg:grid-cols-12">
            {/* Les commandes. */}
            <div className="space-y-10 p-5 xs:p-6 sm:space-y-9 sm:p-9 lg:col-span-7 lg:border-r lg:border-edge/50">
              {calculatorSteps.map((step, stepIndex) => (
                <fieldset key={step.id}>
                  <legend className="mb-4 flex items-center gap-3">
                    <span className="font-mono text-[0.625rem] text-dim tabular-nums">
                      0{stepIndex + 1}
                    </span>
                    <span className="text-sm font-medium text-star sm:text-base">
                      {step.question}
                    </span>
                  </legend>

                  {/*
                    Deux colonnes sur un écran de 375 px, ce sont deux
                    cartes de 130 px : l'intitulé passe à la ligne, l'indice
                    en dessous se casse en trois, et la case à cocher vient
                    manger le peu qui reste. Une seule colonne au doigt —
                    chaque option redevient une vraie ligne qu'on peut lire
                    et viser.
                  */}
                  <div className="grid grid-cols-1 gap-2.5 xs:grid-cols-2 sm:gap-3">
                    {step.options.map((option) => {
                      const active = answers[step.id]?.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggle(step.id, option, step.multiple)}
                          className={cn(
                            "group relative min-h-14 overflow-hidden rounded-card border p-4 text-left transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                            active
                              ? "border-accent-soft/70 bg-accent/12"
                              : "border-edge/60 bg-white/[0.02] hover:border-edge hover:bg-white/[0.05]",
                          )}
                        >
                          {/* Sur un choix unique, la lueur se déplace d'une
                              option à l'autre : la commande a bougé. */}
                          {active && (
                            <motion.span
                              layoutId={step.multiple ? undefined : `glow-${step.id}`}
                              aria-hidden="true"
                              className="pointer-events-none absolute -inset-8 bg-accent/25 blur-2xl"
                              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            />
                          )}

                          <span className="relative flex items-start justify-between gap-2">
                            <span>
                              <span
                                className={cn(
                                  "block text-sm font-medium transition-colors duration-300",
                                  active ? "text-star" : "text-mist",
                                )}
                              >
                                {option.label}
                              </span>
                              <span className="mt-1 block text-[0.6875rem] leading-snug text-dim">
                                {option.hint}
                              </span>
                            </span>

                            <span
                              className={cn(
                                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                                active
                                  ? "border-accent-soft bg-accent-soft/25 text-accent-glow"
                                  : "border-edge/80 text-transparent",
                              )}
                            >
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>

            {/* La lecture des instruments. */}
            <div className="relative flex flex-col justify-between gap-8 border-t border-edge/50 p-5 xs:p-6 sm:p-9 lg:col-span-5 lg:border-t-0">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(61,107,255,0.14),transparent_60%)]"
              />

              <div className="relative">
                {/* LA MISSION RECOMMANDÉE
                    Le montant ne tombe jamais du ciel : il est d'abord
                    rattaché à l'un des trois paliers, nommé et daté. C'est
                    la seule façon pour le visiteur de relier ce qu'il vient
                    de configurer à ce qu'il a lu plus haut. */}
                <span className="font-mono text-[0.625rem] tracking-[0.22em] text-dim uppercase">
                  Mission recommandée
                </span>
                <motion.p
                  key={result.plan.id}
                  initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="type-safe mt-3 font-display text-[clamp(1.35rem,4.4vw,1.85rem)] leading-none font-medium tracking-[-0.03em] text-accent-glow"
                >
                  {result.plan.name}
                </motion.p>
                <p className="mt-2.5 max-w-[34ch] text-xs leading-relaxed text-dim">
                  {result.plan.pitch}
                </p>

                <div className="mt-8 h-px w-full bg-edge/50" />

                <span className="mt-8 block font-mono text-[0.625rem] tracking-[0.22em] text-dim uppercase">
                  Estimation indicative
                </span>

                <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <Counter
                    value={result.low}
                    format={(n) => formatEuro(n)}
                    className="font-display text-[clamp(2rem,7vw,3rem)] leading-none font-medium tracking-tight text-star tabular-nums"
                  />
                  <span className="font-display text-2xl text-dim">–</span>
                  <Counter
                    value={result.high}
                    format={(n) => formatEuro(n)}
                    className="font-display text-[clamp(2rem,7vw,3rem)] leading-none font-medium tracking-tight text-star tabular-nums"
                  />
                </div>

                <p className="mt-4 text-xs leading-relaxed text-dim">
                  Estimation indicative, et non un devis définitif. Elle part
                  du prix annoncé de la mission, hors nom de domaine et
                  hébergement. Le montant ferme est fixé après notre premier
                  échange.
                </p>

                {/* Jauges : délai et suivi. */}
                <dl className="mt-8 space-y-5">
                  <div>
                    <div className="flex items-baseline justify-between">
                      <dt className="font-mono text-[0.625rem] tracking-[0.18em] text-mist uppercase">
                        Délai estimé
                      </dt>
                      <dd className="font-mono text-sm text-star tabular-nums">
                        <Counter value={result.days} /> jours
                      </dd>
                    </div>
                    <div className="mt-2.5 h-px w-full bg-ink">
                      <motion.div
                        className="h-full bg-linear-to-r from-accent to-accent-glow shadow-[0_0_10px_0_rgba(110,151,255,0.7)]"
                        animate={{
                          // La jauge est bornée au délai le plus long qu'une
                          // mission puisse atteindre, modules compris.
                          width: `${Math.min(100, (result.days / 19) * 100)}%`,
                        }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between border-t border-edge/40 pt-5">
                    <dt className="font-mono text-[0.625rem] tracking-[0.18em] text-mist uppercase">
                      Suivi mensuel
                    </dt>
                    <dd className="font-mono text-sm text-star tabular-nums">
                      {result.care ? `${formatEuro(maintenance.price)} / mois` : "—"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="relative">
                <Button href="#contact" className="w-full" onClick={sendToForm}>
                  Transformer en devis ferme
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
                <p className="mt-3 text-center text-[0.6875rem] text-dim">
                  Vos réponses sont reprises automatiquement dans le formulaire.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
      </div>
    </section>
  );
}
