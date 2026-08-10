import type { BodySpec } from "./Body";

/**
 * LA CARTE DU CIEL
 * ==========================================================================
 * Chaque monde a une coordonnée fixe dans le couloir de vol. Ils ne bougent
 * pas : c'est nous qui passons. Un corps grandit parce qu'on s'en approche,
 * sort du cadre parce qu'on le double, et disparaît derrière nous.
 *
 * `z` se lit contre la profondeur parcourue par la caméra (0 → -560).
 * Repères : constat ≈ -100, missions ≈ -160, réalisations ≈ -200,
 * signal ≈ -300, offres ≈ -390, contact ≈ -520.
 */

export type Placement = {
  id: string;
  /** Nom affiché par la télémétrie du HUD quand le corps est le plus proche. */
  name: string;
  position: [number, number, number];
  radius: number;
  spec: BodySpec;
  /** Système d'anneaux, en rayons planétaires. */
  rings?: {
    inner: number;
    outer: number;
    color: string;
    colorEdge: string;
    opacity?: number;
    tilt?: [number, number, number];
  };
  /** Satellite en orbite autour du corps. */
  moon?: {
    radius: number;
    /** Distance orbitale, en rayons planétaires. */
    orbit: number;
    speed: number;
    inclination: number;
    spec: BodySpec;
  };
  /** `false` : le corps est retiré sur les appareils modestes. */
  essential?: boolean;
};

export const WORLDS: Placement[] = [
  {
    id: "prime",
    name: "Kubyza Prime",
    // Le monde de départ. On le quitte dans les premières secondes.
    position: [8.5, -2.2, -34],
    radius: 4,
    essential: true,
    spec: {
      surface: "ocean",
      low: "#050c1e",
      high: "#2f4f96",
      rim: "#7aa5ff",
      relief: 1.4,
      gloss: 0.22,
      atmosphere: 0.055,
      atmosphereIntensity: 1.7,
      spin: 0.025,
      tilt: 0.28,
    },
    rings: {
      inner: 1.7,
      outer: 2.05,
      color: "#7aa5ff",
      colorEdge: "#3d6bff",
      opacity: 0.3,
      tilt: [Math.PI / 2.3, 0, 0.42],
    },
    moon: {
      radius: 0.62,
      orbit: 2.4,
      speed: 0.16,
      inclination: 0.35,
      spec: {
        surface: "moon",
        low: "#15161c",
        high: "#8d8f9c",
        rim: "#c8cede",
        relief: 1.9,
        spin: 0.05,
      },
    },
  },
  {
    id: "erosion",
    name: "Érosion",
    // Le constat : un monde mort, criblé, sans atmosphère. Rien n'y pousse.
    position: [-11, 3.2, -105],
    radius: 5,
    essential: true,
    spec: {
      surface: "rock",
      low: "#1c140f",
      high: "#8a6c4e",
      rim: "#e0956a",
      relief: 2.4,
      gloss: 0,
      spin: 0.016,
      tilt: -0.42,
    },
  },
  {
    id: "givre",
    name: "Givre",
    // Les réalisations : la zone claire du voyage. Tout y réfléchit.
    position: [10.5, -3.5, -235],
    radius: 5.6,
    essential: true,
    spec: {
      surface: "ice",
      low: "#2a4a6e",
      high: "#e8f6ff",
      rim: "#a8e8ff",
      relief: 1.1,
      gloss: 0.9,
      emissive: 0.04,
      atmosphere: 0.035,
      atmosphereIntensity: 1.1,
      spin: 0.03,
      tilt: 0.55,
    },
    rings: {
      inner: 1.45,
      outer: 2.3,
      color: "#dff4ff",
      colorEdge: "#69bfe8",
      opacity: 0.42,
      tilt: [Math.PI / 2.9, 0, -0.3],
    },
  },
  {
    id: "ombre",
    name: "Ombre",
    // Le signal : un corps que la lumière refuse. Il ne se voit qu'au limbe.
    // C'est la scène noire sur laquelle l'objet va s'allumer.
    position: [6.5, 1.4, -352],
    radius: 6.5,
    essential: true,
    spec: {
      surface: "dark",
      low: "#04050a",
      high: "#161a26",
      rim: "#ffca57",
      relief: 2,
      gloss: 0.05,
      atmosphere: 0.025,
      atmosphereIntensity: 0.9,
      spin: 0.012,
      tilt: -0.2,
    },
  },
  {
    id: "meridienne",
    name: "Méridienne",
    // Les offres : on entre réellement dans son orbite, anneaux compris.
    position: [-16, 5, -410],
    radius: 10,
    essential: true,
    spec: {
      surface: "gas",
      low: "#5c2f12",
      high: "#f0bb7c",
      rim: "#ffcf9a",
      relief: 0.5,
      gloss: 0.1,
      spin: 0.045,
      tilt: 0.16,
      // On passe littéralement dans son orbite : elle occupe l'écran entier.
      maxOctaves: 4,
    },
    rings: {
      inner: 1.35,
      outer: 2.55,
      color: "#f7d9b4",
      colorEdge: "#8a5c33",
      opacity: 0.7,
      tilt: [Math.PI / 2.5, 0, 0.24],
    },
  },
  {
    id: "horizon",
    name: "Terminus",
    // L'arrivée : le corps devient un horizon, pas une planète.
    position: [0, -18, -600],
    radius: 20,
    essential: true,
    spec: {
      surface: "ocean",
      low: "#040a18",
      high: "#3a5ea8",
      rim: "#8fb4ff",
      relief: 1.2,
      gloss: 0.3,
      atmosphere: 0.03,
      atmosphereIntensity: 2.1,
      spin: 0.008,
      tilt: 0.1,
      // L'horizon final couvre toute la largeur de l'écran : c'est le
      // corps le plus coûteux du voyage, et le moins détaillé qu'on voie.
      maxOctaves: 3,
    },
  },

  /* --- Lointains : ils ne servent qu'à donner l'échelle. --------------- */
  {
    id: "lointain-a",
    name: "Vestige",
    position: [-38, -16, -180],
    radius: 3,
    spec: {
      surface: "rock",
      low: "#131018",
      high: "#4e4657",
      rim: "#8f86b8",
      relief: 1.6,
      spin: 0.02,
    },
  },
  {
    id: "lointain-b",
    name: "Cendre",
    position: [31, -19, -395],
    radius: 4,
    spec: {
      surface: "dark",
      low: "#06070d",
      high: "#232839",
      rim: "#6e97ff",
      relief: 1.4,
      spin: 0.014,
    },
  },
  {
    id: "lointain-c",
    name: "Aurore",
    position: [-27, 13, -505],
    radius: 3.6,
    spec: {
      surface: "ice",
      low: "#1c3654",
      high: "#cfe8ff",
      rim: "#9fd8ff",
      relief: 0.9,
      gloss: 0.6,
      spin: 0.026,
    },
  },
];

/** Champs de débris : deux traversées, chacune juste après un survol. */
export const DEBRIS_FIELDS = [
  {
    id: "ceinture-erosion",
    position: [-2, 1, -140] as [number, number, number],
    spread: [30, 20, 80] as [number, number, number],
    scale: 0.5,
    color: "#6a5a4a",
    rim: "#e0a878",
    seed: 41,
  },
  {
    id: "ceinture-meridienne",
    position: [1, -1, -450] as [number, number, number],
    spread: [34, 22, 90] as [number, number, number],
    scale: 0.62,
    color: "#5c6480",
    rim: "#ffc48a",
    seed: 733,
  },
];
