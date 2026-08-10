/**
 * État partagé entre le DOM et la scène 3D.
 *
 * Volontairement hors de React : la scène lit ces valeurs 60 fois par seconde
 * dans `useFrame`. Passer par un state React provoquerait un rendu par frame.
 */
export const viewportState = {
  /** Progression du scroll sur toute la page, de 0 à 1. */
  scroll: 0,
  /** Vitesse instantanée du scroll (px/frame), utile pour étirer les étoiles. */
  velocity: 0,
  /** Position du curseur, normalisée entre -1 et 1. */
  pointerX: 0,
  pointerY: 0,
  /** `false` quand l'onglet est masqué : on met la scène en pause. */
  visible: true,
};

/** Indices des sections clés, pour les mouvements de caméra. */
export const SCENE_MARKS = {
  hero: 0,
  intro: 0.08,
  problem: 0.18,
  solution: 0.28,
  services: 0.38,
  process: 0.48,
  portfolio: 0.58,
  pricing: 0.72,
  contact: 0.92,
} as const;
