"use client";

import { site } from "@/data/site";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { ContactForm } from "./ContactForm";
import { Mail, Phone } from "@/components/ui/Icons";

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
