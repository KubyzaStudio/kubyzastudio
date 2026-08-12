"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { site } from "@/data/site";
import { services } from "@/data/services";
import { Logo } from "./Logo";
import { Reveal } from "@/components/ui/Reveal";
import { ArrowUpRight } from "@/components/ui/Icons";

/**
 * Dernière scène : l'horizon d'une planète, et le silence.
 * La courbe lumineuse en bas de page est un simple dégradé — aucun coût GPU.
 */
export function Footer() {
  return (
    <footer className="relative overflow-hidden pt-28 sm:pt-40">
      <div className="container-x relative z-1">
        {/* Message de clôture. */}
        <div className="flex flex-col items-center pb-24 text-center sm:pb-32">
          <Reveal blur={false} y={10}>
            <span className="label-mono text-dim">Fin de transmission</span>
          </Reveal>

          <Reveal delay={0.1} className="mt-8">
            <p className="font-display text-[clamp(2.5rem,11vw,7rem)] leading-none font-medium tracking-[-0.04em] type-luminous">
              Kubyza Studio
            </p>
          </Reveal>

          <Reveal delay={0.25} className="mt-6">
            <p className="font-mono text-[0.6875rem] tracking-[0.34em] text-mist uppercase">
              Mission accomplie
            </p>
          </Reveal>

          <Reveal delay={0.35} className="mt-12">
            <a
              href="#contact"
              className="group inline-flex items-center gap-2.5 rounded-full border border-edge/70 px-6 py-3.5 text-sm text-star transition-colors duration-500 hover:border-accent-soft/60"
            >
              Lancer votre mission
              <ArrowUpRight className="h-4 w-4 text-accent-soft transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </Reveal>
        </div>

        {/* Plan du site — posé sur un voile sombre : la planète passe derrière,
            les liens restent lisibles. */}
        <div className="relative grid gap-12 border-t border-edge/40 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-6 -inset-y-2 -z-1 bg-void/70 blur-xl"
          />
          <div>
            <Logo />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-dim">
              {site.tagline}
            </p>
            <p className="mt-4 font-mono text-[0.625rem] tracking-[0.18em] text-dim uppercase">
              {site.location.city} · {site.location.regionCode} ·{" "}
              {site.location.country}
            </p>
          </div>

          <nav aria-label="Missions">
            <h2 className="font-mono text-[0.625rem] tracking-[0.22em] text-dim uppercase">
              Missions
            </h2>
            <ul className="mt-5 space-y-2.5">
              {services.map((service) => (
                <li key={service.id}>
                  <a
                    href="#missions"
                    className="text-sm text-mist transition-colors duration-300 hover:text-star"
                  >
                    {service.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Navigation du pied de page">
            <h2 className="font-mono text-[0.625rem] tracking-[0.22em] text-dim uppercase">
              Le voyage
            </h2>
            <ul className="mt-5 space-y-2.5">
              {site.journey.map((step) => (
                <li key={step.href}>
                  <a
                    href={step.href}
                    className="group flex items-baseline gap-3 text-sm text-mist transition-colors duration-300 hover:text-star"
                  >
                    <span className="font-mono text-[0.5625rem] text-dim tabular-nums">
                      {step.code}
                    </span>
                    {step.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-mono text-[0.625rem] tracking-[0.22em] text-dim uppercase">
              Contact
            </h2>
            <ul className="mt-5 space-y-2.5">
              <li>
                <a
                  href={`mailto:${site.contact.email}`}
                  className="text-sm text-mist transition-colors duration-300 hover:text-star"
                >
                  {site.contact.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${site.contact.phoneRaw}`}
                  className="text-sm text-mist transition-colors duration-300 hover:text-star"
                >
                  {site.contact.phone}
                </a>
              </li>
            </ul>

            {/*
              LES CANAUX
              Ce ne sont pas trois liens de plus dans une liste : ce sont les
              mêmes objets que la section « Signal », en plus petit. L'artefact
              détouré, son halo, le pseudo, la promesse. La cohérence de
              l'univers tient à ce qu'un canal ait toujours la même forme, où
              qu'on le croise.

              La liste vient de `site.channels` : les adresses ne sont écrites
              qu'une seule fois dans tout le projet (`src/data/site.ts`,
              surchargeable par variables d'environnement).
            */}
            <h3 className="mt-9 font-mono text-[0.625rem] tracking-[0.22em] text-dim uppercase">
              Canaux directs
            </h3>
            <ul className="mt-5 space-y-2.5">
              {site.socials.map((channel) => (
                <li key={channel.id}>
                  <a
                    href={channel.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-center gap-3.5 rounded-full border border-edge/60 py-2 pr-4 pl-2 transition-colors duration-500 hover:border-accent-soft/50"
                  >
                    <span className="relative block h-8 w-8 shrink-0">
                      <span
                        aria-hidden="true"
                        className="absolute inset-[-40%] rounded-full bg-accent/25 opacity-0 blur-lg transition-opacity duration-700 group-hover:opacity-100"
                      />
                      <Image
                        src={channel.artifactSmall}
                        alt=""
                        fill
                        sizes="32px"
                        className="relative object-contain mix-blend-screen"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm text-mist transition-colors duration-300 group-hover:text-star">
                        {channel.label}
                      </span>
                      <span className="block truncate font-mono text-[0.5625rem] tracking-[0.16em] text-dim uppercase">
                        {channel.handle}
                      </span>
                    </span>
                    <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-dim transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent-soft" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-edge/40 py-8 sm:flex-row sm:items-center sm:justify-between">
          {/* L'année est figée au build ; le client la corrige à l'hydratation. */}
          <p
            suppressHydrationWarning
            className="font-mono text-[0.625rem] tracking-[0.16em] text-dim uppercase"
          >
            © {new Date().getFullYear()} {site.name}
          </p>
          <p className="font-mono text-[0.625rem] tracking-[0.16em] text-dim uppercase">
            Conçu et développé en Seine-et-Marne
          </p>
        </div>
      </div>

      {/* L'horizon : une planète qui remplit le bas de l'écran. */}
      <div aria-hidden="true" className="pointer-events-none relative h-40 sm:h-56">
        <motion.div
          className="absolute -bottom-[42rem] left-1/2 h-[48rem] w-[130vw] max-w-none rounded-[50%]"
          style={{
            // Le centrage horizontal appartient à Motion : `y` est animé,
            // donc la transformation en ligne remplace intégralement celle
            // des classes — une translation posée en CSS y disparaîtrait,
            // et l'horizon partirait de 65 vw sur la droite.
            x: "-50%",
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(61,107,255,0.35) 0%, rgba(18,26,51,0.9) 45%, #05070f 78%)",
            boxShadow: "0 -1px 60px 0 rgba(110,151,255,0.35)",
          }}
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-accent-glow/50 to-transparent" />
      </div>
    </footer>
  );
}
