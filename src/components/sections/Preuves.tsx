"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { faq } from "@/data/faq";
import { commitments } from "@/data/commitments";
import { processSteps } from "@/data/process";
import { plans } from "@/data/pricing";
import { site } from "@/data/site";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { Reveal } from "@/components/ui/Reveal";
import { Plus } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * LES PREUVES
 * ==========================================================================
 * Trois choses que le visiteur veut vérifier avant de vous écrire :
 * ce que les autres en disent, comment ça se passe, et ce qui l'inquiète
 * encore. Elles tenaient dans trois sections identiques ; elles tiennent
 * ici dans une seule, et chacune a une forme différente.
 *
 * · Les témoignages défilent horizontalement, en bande.
 * · Le déroulé est une frise, à l'horizontale elle aussi mais plus dense.
 * · Les questions restent une liste dépliable, la seule forme qui
 *   convienne à une question.
 */
export function Preuves() {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();

  return (
    <section id="preuves" className="relative isolate py-28 sm:py-40">
      {/* --- Ce sur quoi on s'engage ---------------------------------- */}
      <div className="container-x">
        <SectionMarker code="08" label="Engagements" />
      </div>

      <div
        className="mt-14 flex gap-5 overflow-x-auto pb-4 pl-5 sm:mt-20 sm:gap-7 sm:pl-10 lg:pl-16 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {commitments.map((commitment, index) => (
          <motion.article
            key={commitment.id}
            className="flex w-[78vw] shrink-0 flex-col border-t border-edge/50 pt-7 sm:w-[24rem]"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px -8% 0px -8%" }}
            transition={{ duration: 0.9, delay: index * 0.07, ease: EASE }}
          >
            <div className="flex items-center gap-2.5">
              <span className="h-1 w-1 rounded-full bg-accent-soft shadow-[0_0_8px_1px_rgba(110,151,255,0.8)]" />
              <span className="font-mono text-[0.5rem] tracking-[0.24em] text-accent-soft/80 uppercase">
                {commitment.code}
              </span>
            </div>

            <h3 className="mt-6 font-display text-lg leading-snug text-star sm:text-xl">
              {commitment.title}
            </h3>

            <p className="mt-4 flex-1 text-sm leading-relaxed text-mist">
              {commitment.body}
            </p>
          </motion.article>
        ))}
      </div>

      {/* La phrase disait « aucun avis n'est affiché tant qu'il n'a pas été
          recueilli et autorisé ». C'était vrai parce qu'il n'y avait pas de
          mécanisme ; c'est vrai désormais parce qu'il y en a un. La règle n'a
          pas changé — elle est simplement appliquée par la base de données,
          et le visiteur peut maintenant y contribuer. */}
      <p className="container-x mt-8 max-w-md text-xs leading-relaxed text-dim">
        Les engagements ci-dessus sont ceux du studio. Ce que les clients en
        disent est{" "}
        <a
          href="#avis"
          className="text-accent-soft underline-offset-4 transition-colors duration-300 hover:text-accent-glow hover:underline"
        >
          plus bas, dans les avis
        </a>{" "}
        — aucun n&apos;y paraît sans avoir été recueilli et vérifié.
      </p>

      {/* --- Comment ça se passe -------------------------------------- */}
      <div className="container-x mt-28 sm:mt-40">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="type-safe max-w-xl font-display text-[clamp(1.8rem,4.2vw,3.2rem)] leading-[0.96] font-medium tracking-[-0.04em] text-star">
            De {plans[0].days} à {plans[plans.length - 1].days} jours entre la
            première conversation
            <span className="text-dim"> et votre lien partagé.</span>
          </h2>
          <span className="shrink-0 font-mono text-[0.5625rem] tracking-[0.24em] text-dim uppercase">
            Déroulé
          </span>
        </div>

        {/* La frise : une seule ligne traversante, six arrêts dessus. */}
        <ol className="relative mt-16 grid gap-y-10 sm:mt-20 sm:grid-cols-3 lg:grid-cols-6">
          <span
            aria-hidden="true"
            className="absolute top-1.5 left-0 hidden h-px w-full bg-linear-to-r from-accent/50 via-edge/60 to-transparent lg:block"
          />
          {processSteps.map((step, index) => (
            <motion.li
              key={step.code}
              className="relative pr-6"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.07, ease: EASE }}
            >
              <span
                aria-hidden="true"
                className="block h-3 w-3 -translate-x-px rounded-full border border-accent/40 bg-void"
              >
                <span className="block h-full w-full scale-[0.35] rounded-full bg-accent-glow shadow-[0_0_8px_2px_rgba(110,151,255,0.7)]" />
              </span>

              <span className="mt-5 block font-mono text-[0.5625rem] tracking-[0.2em] text-accent-soft uppercase">
                {step.duration}
              </span>
              <h3 className="mt-2.5 font-display text-base leading-tight font-medium text-star">
                {step.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-dim">
                {step.yourPart}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>

      {/* --- Ce qui reste en travers ---------------------------------- */}
      <div className="container-x mt-28 sm:mt-40">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <h2 className="type-safe font-display text-[clamp(1.6rem,3.4vw,2.6rem)] leading-[1] font-medium tracking-[-0.03em] text-star">
              Ce qu&apos;on nous demande
              <br />
              avant de commencer.
            </h2>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-dim">
              Si votre question n&apos;est pas là, écrivez-nous. On répond vite,
              et sans jargon.
            </p>
            <a
              href={`mailto:${site.contact.email}`}
              className="mt-6 inline-flex text-sm text-accent-soft transition-colors duration-300 hover:text-accent-glow"
            >
              {site.contact.email}
            </a>
          </div>

          <ul className="lg:col-span-7 lg:col-start-6">
            {faq.map((item, index) => {
              const isOpen = open === index;
              const panelId = `${baseId}-faq-${index}`;

              return (
                <Reveal
                  as="li"
                  key={item.question}
                  delay={index * 0.04}
                  y={12}
                  blur={false}
                  className="border-b border-edge/50 first:border-t first:border-edge/50"
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="group flex w-full items-start justify-between gap-6 py-6 text-left"
                    >
                      <span
                        className={cn(
                          "font-display text-lg leading-snug font-medium transition-colors duration-500 sm:text-xl",
                          isOpen ? "text-star" : "text-mist group-hover:text-star",
                        )}
                      >
                        {item.question}
                      </span>

                      <span
                        className={cn(
                          "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                          isOpen
                            ? "rotate-135 border-accent-soft/70 bg-accent/15 text-accent-glow"
                            : "border-edge/70 text-dim group-hover:border-edge",
                        )}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.6, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <p className="max-w-xl pr-12 pb-7 text-sm leading-relaxed text-mist">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
