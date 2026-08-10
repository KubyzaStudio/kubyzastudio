import * as THREE from "three";
import { clamp, lerp } from "@/lib/utils";

/**
 * LE VOYAGE
 * ==========================================================================
 * Le site n'est pas une pile de sections devant un décor fixe : c'est une
 * traversée. La caméra avance réellement sur `TRAVEL` unités de profondeur,
 * et les corps célestes sont posés à des coordonnées fixes le long du
 * couloir. On ne déplace jamais une planète pour faire joli — on passe
 * devant elle, elle grandit, elle sort du cadre. C'est ce qui donne la
 * sensation d'espace que du parallaxe ne produira jamais.
 *
 * Chaque chapitre décrit l'ambiance du vide à cet instant du récit :
 * couleur de la nébuleuse, densité, dérive et roulis de la caméra.
 */

export const TRAVEL = 560;

export type Chapter = {
  id: string;
  /** Position dans le scroll, sur [0,1]. */
  at: number;
  /** Les deux teintes de la nébuleuse traversée. */
  nebulaA: string;
  nebulaB: string;
  /** Densité du nuage. 0 = vide absolu. */
  density: number;
  /** Chaleur générale du ciel : teinte les étoiles et le halo. */
  ambient: string;
  /** Dérive latérale et verticale de la caméra, en unités monde. */
  drift: [number, number];
  /** Roulis, en radians : le vaisseau s'incline dans les virages. */
  roll: number;
  /** Champ de vision : se resserre dans les moments d'attention. */
  fov: number;
};

/**
 * Le fond ne reste jamais identique. Chaque étape a sa lumière.
 */
export const CHAPTERS: Chapter[] = [
  {
    id: "depart",
    at: 0,
    nebulaA: "#16255e",
    nebulaB: "#2c1f56",
    density: 0.34,
    ambient: "#7ea4ff",
    drift: [0, 0],
    roll: 0,
    fov: 52,
  },
  {
    id: "transmission",
    // Le constat : le ciel se referme, une alerte sourde monte.
    at: 0.14,
    nebulaA: "#4a1f38",
    nebulaB: "#20204d",
    density: 0.5,
    ambient: "#ff9bb0",
    drift: [-2.4, 0.9],
    roll: 0.045,
    fov: 56,
  },
  {
    id: "missions",
    // Le passage dans la nébuleuse : le moment le plus dense du voyage.
    at: 0.3,
    nebulaA: "#3a1d78",
    nebulaB: "#8a2ea8",
    density: 0.92,
    ambient: "#c79bff",
    drift: [2.8, -1.1],
    roll: -0.06,
    fov: 58,
  },
  {
    id: "realisations",
    // On débouche : zone claire, lumineuse, respirable.
    at: 0.46,
    nebulaA: "#1d5f8e",
    nebulaB: "#3ea9c9",
    density: 0.62,
    ambient: "#a9e6ff",
    drift: [-3.2, -0.6],
    roll: 0.05,
    fov: 50,
  },
  {
    id: "signal",
    // Presque rien. Le noir sert de scène à l'objet qui va s'allumer.
    at: 0.6,
    nebulaA: "#0d1120",
    nebulaB: "#3a2a10",
    density: 0.16,
    ambient: "#ffd76a",
    drift: [1.4, 0.4],
    roll: -0.02,
    fov: 46,
  },
  {
    id: "offres",
    // Mise en orbite : la lumière chaude d'une géante toute proche.
    at: 0.72,
    nebulaA: "#6b3410",
    nebulaB: "#8a5a1f",
    density: 0.55,
    ambient: "#ffc48a",
    drift: [-2.2, 1.3],
    roll: 0.055,
    fov: 54,
  },
  {
    id: "approche",
    at: 0.86,
    nebulaA: "#17306b",
    nebulaB: "#2b4a9c",
    density: 0.44,
    ambient: "#8fb4ff",
    drift: [1.8, -0.5],
    roll: -0.03,
    fov: 51,
  },
  {
    id: "immensite",
    // Retour au vide. Rien autour. Juste la distance.
    at: 1,
    nebulaA: "#0f1a44",
    nebulaB: "#191d4e",
    density: 0.24,
    ambient: "#7ea4ff",
    drift: [0, 0.2],
    roll: 0,
    fov: 55,
  },
];

/** Ambiance interpolée : aucune coupure franche entre deux chapitres. */
export type Ambience = {
  nebulaA: THREE.Color;
  nebulaB: THREE.Color;
  ambient: THREE.Color;
  density: number;
  driftX: number;
  driftY: number;
  roll: number;
  fov: number;
};

/** Objets réutilisés à chaque frame — aucune allocation dans la boucle. */
export function createAmbience(): Ambience {
  const first = CHAPTERS[0];
  return {
    nebulaA: new THREE.Color(first.nebulaA),
    nebulaB: new THREE.Color(first.nebulaB),
    ambient: new THREE.Color(first.ambient),
    density: first.density,
    driftX: 0,
    driftY: 0,
    roll: 0,
    fov: first.fov,
  };
}

const colorA = new THREE.Color();
const colorB = new THREE.Color();
const colorC = new THREE.Color();

/**
 * Échantillonne l'ambiance à une position donnée du scroll.
 * `smoothstep` sur chaque segment : la transition n'a ni départ ni arrivée
 * perceptibles, le ciel change sans qu'on puisse dire quand.
 */
export function sampleAmbience(scroll: number, out: Ambience): Ambience {
  const t = clamp(scroll);

  let i = 0;
  while (i < CHAPTERS.length - 2 && t > CHAPTERS[i + 1].at) i++;

  const a = CHAPTERS[i];
  const b = CHAPTERS[i + 1];
  const span = b.at - a.at;
  const raw = span === 0 ? 0 : clamp((t - a.at) / span);
  const k = raw * raw * (3 - 2 * raw);

  out.nebulaA.copy(colorA.set(a.nebulaA)).lerp(colorB.set(b.nebulaA), k);
  out.nebulaB.copy(colorA.set(a.nebulaB)).lerp(colorB.set(b.nebulaB), k);
  out.ambient.copy(colorC.set(a.ambient)).lerp(colorA.set(b.ambient), k);
  out.density = lerp(a.density, b.density, k);
  out.driftX = lerp(a.drift[0], b.drift[0], k);
  out.driftY = lerp(a.drift[1], b.drift[1], k);
  out.roll = lerp(a.roll, b.roll, k);
  out.fov = lerp(a.fov, b.fov, k);

  return out;
}

/** Profondeur atteinte par la caméra pour une progression donnée. */
export function travelDepth(scroll: number) {
  // Légère accélération au départ puis vitesse constante : le décollage
  // se sent, la croisière ne fatigue pas.
  const t = clamp(scroll);
  const eased = t * t * (3 - 2 * t) * 0.22 + t * 0.78;
  return eased * TRAVEL;
}
