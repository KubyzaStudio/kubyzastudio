import type { DeviceTier } from "@/lib/hooks";

/**
 * Budget graphique par niveau d'appareil.
 * Une seule table : impossible d'oublier d'alléger quelque chose sur mobile.
 */
export type QualityPreset = {
  /** Nombre d'étoiles par couche, du plus proche au plus lointain. */
  starLayers: [number, number, number];
  /** Segments de la sphère planète. */
  planetSegments: number;
  /** Octaves de bruit du relief et de la nébuleuse. */
  octaves: number;
  /** Nappes de nébuleuse superposées. */
  nebulaLayers: number;
  /** Fragments par champ de débris. `0` = aucun champ. */
  debris: number;
  /** `false` : seuls les mondes du récit principal sont chargés. */
  allWorlds: boolean;
  /** Plafond du device pixel ratio. */
  maxDpr: number;
  /** Parallaxe souris. */
  pointerParallax: boolean;
  /** Objet 3D interactif de la section Signal. */
  signalObject: boolean;
};

export const QUALITY: Record<Exclude<DeviceTier, "low">, QualityPreset> = {
  medium: {
    starLayers: [300, 420, 560],
    planetSegments: 44,
    octaves: 3,
    nebulaLayers: 1,
    debris: 0,
    allWorlds: false,
    maxDpr: 1.25,
    pointerParallax: false,
    signalObject: true,
  },
  high: {
    starLayers: [780, 1100, 1600],
    planetSegments: 96,
    octaves: 5,
    nebulaLayers: 2,
    debris: 260,
    allWorlds: true,
    maxDpr: 1.75,
    pointerParallax: true,
    signalObject: true,
  },
};
