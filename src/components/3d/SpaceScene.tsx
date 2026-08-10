"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import { SceneContent } from "./SceneContent";
import { QUALITY } from "./quality";
import { StaticSky } from "./StaticSky";

/**
 * Décor WebGL : un seul canvas fixe, derrière tout le contenu.
 *
 * Ce module — et Three.js avec lui — n'est téléchargé que si l'appareil est
 * jugé capable. Le niveau est décidé en amont, dans `SiteShell`.
 */
export function SpaceScene({ tier }: { tier: "medium" | "high" }) {
  const quality = QUALITY[tier];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      // `contain` isole le canvas du reste de la page pour le compositeur.
      style={{ contain: "strict" }}
    >
      {/* Socle de couleur : visible immédiatement, avant que WebGL démarre. */}
      <StaticSky stars={false} className="absolute inset-0" />
      <Canvas
        className="absolute inset-0"
        dpr={[1, quality.maxDpr]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          // Le rendu est déjà composé en additif : pas de tone mapping.
          toneMapping: THREE.NoToneMapping,
        }}
        // `far` doit couvrir toute la traversée : la caméra descend jusqu'à
        // z ≈ -546 et le dernier corps est posé à -600. `near` reste large
        // pour préserver la précision du tampon de profondeur sur 900 unités.
        camera={{ position: [0, 0, 14], fov: 52, near: 0.5, far: 900 }}
      >
        <Suspense fallback={null}>
          <SceneContent quality={quality} />
        </Suspense>
      </Canvas>
    </div>
  );
}
