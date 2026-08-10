"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, type ReactNode } from "react";
import { ExperienceProvider } from "@/components/providers/ExperienceProvider";
import { LaunchContext } from "@/components/providers/LaunchContext";
import { MissionProvider } from "@/components/providers/MissionContext";
import { Preloader } from "./Preloader";
import { Cursor } from "./Cursor";
import { Hud } from "./Hud";
import { StaticSky } from "@/components/3d/StaticSky";
import { useDeviceTier, usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Three.js pèse plusieurs centaines de kilo-octets. Le module n'est demandé
 * qu'après le premier rendu, et uniquement si l'appareil peut le supporter :
 * un téléphone modeste ne télécharge jamais le moteur 3D.
 */
const SpaceScene = dynamic(
  () => import("@/components/3d/SpaceScene").then((m) => m.SpaceScene),
  { ssr: false, loading: () => <StaticSky /> },
);

/**
 * Enveloppe client du site : décor, mouvement, curseur, en-tête, pied de page.
 * `page.tsx` reste un composant serveur — le contenu part en HTML statique.
 */
export function SiteShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [launched, setLaunched] = useState(false);
  const handleDone = useCallback(() => setLaunched(true), []);

  const tier = useDeviceTier();
  const reduced = usePrefersReducedMotion();
  const webgl = !reduced && tier !== "low";

  return (
    <ExperienceProvider>
      <MissionProvider>
        <LaunchContext value={launched}>
          <Preloader onDone={handleDone} />
          {webgl ? <SpaceScene tier={tier} /> : <StaticSky />}

          {/* Voile de lisibilité : le ciel reste visible, le texte reste net.
              Transparent en haut pour ne pas éteindre le hero, il s'épaissit
              dès que le contenu commence. */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-1"
            style={{
              background:
                "linear-gradient(to bottom, rgba(4,5,10,0) 0%, rgba(4,5,10,0.28) 45%, rgba(4,5,10,0.45) 100%)",
            }}
          />

          <Cursor />
          <Hud />
          <main id="contenu" className="vignette relative z-1">
            {children}
          </main>
          {footer}
        </LaunchContext>
      </MissionProvider>
    </ExperienceProvider>
  );
}
