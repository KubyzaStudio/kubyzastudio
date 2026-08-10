import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { AnimatedText } from "./AnimatedText";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Espacement vertical. `wide` pour les sections respirantes. */
  spacing?: "normal" | "wide" | "tight";
};

const spacings = {
  tight: "py-20 sm:py-28",
  normal: "py-28 sm:py-36 lg:py-44",
  wide: "py-36 sm:py-48 lg:py-60",
};

/** Enveloppe commune : le rythme vertical du site tient dans ce composant. */
export function Section({
  id,
  children,
  className,
  spacing = "normal",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn("relative isolate", spacings[spacing], className)}
    >
      <div className="container-x">{children}</div>
    </section>
  );
}

type SectionHeadingProps = {
  /** Étiquette technique affichée au-dessus du titre. */
  label?: string;
  title: string;
  intro?: string;
  className?: string;
  align?: "left" | "center";
  as?: "h2" | "h3";
};

/** Bloc de titre unifié : étiquette, titre géant, phrase d'introduction. */
export function SectionHeading({
  label,
  title,
  intro,
  className,
  align = "left",
  as = "h2",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {label && (
        <Reveal blur={false} y={12} className="mb-6 flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-8 bg-accent/60" />
          <span className="label-mono">{label}</span>
        </Reveal>
      )}
      <AnimatedText
        as={as}
        text={title}
        className={cn(
          "type-heading text-star",
          align === "center" ? "max-w-4xl" : "max-w-3xl",
        )}
      />
      {intro && (
        <Reveal delay={0.15} className="mt-7 max-w-xl">
          <p className="text-base leading-relaxed text-mist sm:text-lg">{intro}</p>
        </Reveal>
      )}
    </div>
  );
}
