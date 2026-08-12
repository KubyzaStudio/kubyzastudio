"use client";

import dynamic from "next/dynamic";
import { site } from "@/data/site";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Mail, Phone } from "@/components/ui/Icons";

/**
 * Le formulaire est le plus gros composant de la page — quatre écrans, un
 * récapitulatif de configuration, une machine à états d'envoi — et c'est
 * aussi le dernier contenu du voyage. Ce que Google doit lire de cette
 * section, ce sont le titre, l'adresse et le numéro, qui restent rendus
 * côté serveur juste à côté ; le formulaire lui-même n'est qu'une suite de
 * champs vides.
 *
 * Il est donc chargé après le reste, et sa hauteur est réservée par le
 * gabarit ci-dessous : la page ne bouge pas d'un pixel quand il se
 * substitue à lui. C'est cette réservation qui rend le report acceptable —
 * sans elle, on échangerait du temps de chargement contre du décalage
 * visuel, ce qui n'est pas un gain mais un déplacement.
 */
const ContactForm = dynamic(
  () => import("./ContactForm").then((m) => m.ContactForm),
  { ssr: false, loading: () => <FormSkeleton /> },
);

/** Le volume exact du formulaire, en creux : bandeau d'étape, corps, pied. */
function FormSkeleton() {
  return (
    <div aria-hidden="true" className="glass overflow-hidden rounded-panel">
      <div className="border-b border-edge/50 bg-void/50 px-6 py-5 sm:px-9">
        <div className="h-2.5 w-24 rounded-full bg-ink/70" />
        <div className="mt-3 h-4 w-40 rounded-full bg-ink/50" />
        <div className="mt-5 flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-px flex-1 bg-ink" />
          ))}
        </div>
      </div>
      <div className="space-y-10 p-6 sm:p-9">
        <div>
          <div className="h-2.5 w-28 rounded-full bg-ink/60" />
          <div className="mt-4 h-px w-full bg-edge/70" />
        </div>
        <div>
          <div className="h-2.5 w-36 rounded-full bg-ink/60" />
          <div className="mt-4 h-px w-full bg-edge/70" />
        </div>
        <div className="h-14 w-full rounded-full bg-ink/40 sm:ml-auto sm:h-15 sm:w-48" />
      </div>
    </div>
  );
}

/**
 * Le point de conversion.
 * Aucun formulaire froid : une invitation, puis quatre questions courtes.
 */
export function Contact() {
  return (
    <Section id="contact" spacing="wide">
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal blur={false} y={12} className="mb-6 flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-accent/60" />
            <span className="label-mono">Préparer votre mission</span>
          </Reveal>

          <AnimatedText
            as="h2"
            text="Prêt pour votre lancement ?"
            className="type-heading text-star"
          />

          <Reveal delay={0.15} className="mt-7">
            <p className="max-w-md text-base leading-relaxed text-mist sm:text-lg">
              Parlons de votre projet et préparons votre prochaine étape.
            </p>
          </Reveal>

          <Reveal delay={0.25} className="mt-12">
            <div className="hairline" />

            <ul className="mt-8 space-y-5">
              <li>
                <a
                  href={`mailto:${site.contact.email}`}
                  className="group flex items-center gap-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-edge/70 text-accent-soft transition-colors duration-500 group-hover:border-accent-soft/60">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <span>
                    <span className="block font-mono text-[0.625rem] tracking-[0.2em] text-dim uppercase">
                      Écrire
                    </span>
                    <span className="mt-1 block text-sm text-star transition-colors duration-300 group-hover:text-accent-glow">
                      {site.contact.email}
                    </span>
                  </span>
                </a>
              </li>

              <li>
                <a
                  href={`tel:${site.contact.phoneRaw}`}
                  className="group flex items-center gap-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-edge/70 text-accent-soft transition-colors duration-500 group-hover:border-accent-soft/60">
                    <Phone className="h-4.5 w-4.5" />
                  </span>
                  <span>
                    <span className="block font-mono text-[0.625rem] tracking-[0.2em] text-dim uppercase">
                      Appeler
                    </span>
                    <span className="mt-1 block text-sm text-star transition-colors duration-300 group-hover:text-accent-glow">
                      {site.contact.phone}
                    </span>
                  </span>
                </a>
              </li>
            </ul>

            <p className="mt-10 max-w-sm text-xs leading-relaxed text-dim">
              Basés à {site.location.city}, nous accompagnons les entreprises de{" "}
              {site.location.region} et travaillons à distance partout en France.
            </p>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
