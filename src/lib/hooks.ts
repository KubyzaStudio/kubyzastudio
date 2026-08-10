"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * S'abonne à une media query.
 * `useSyncExternalStore` évite le cycle « rendu → effet → nouveau rendu » :
 * la valeur est lue directement, avec `false` comme instantané serveur.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** `true` si l'utilisateur demande moins d'animation. */
export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** `true` sur écran tactile ou petit écran : on allège tout. */
export function useIsTouch() {
  return useMediaQuery("(hover: none), (max-width: 767px)");
}

export type DeviceTier = "low" | "medium" | "high";

/**
 * Évalue une fois la puissance approximative de l'appareil.
 * Sert à dimensionner la scène 3D : particules, résolution, effets.
 * Volontairement prudent — mieux vaut fluide que spectaculaire.
 */
function computeTier(): DeviceTier {
  const coarse = window.matchMedia("(hover: none)").matches;
  const narrow = window.innerWidth < 768;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const saveData =
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData ?? false;

  // Appareil bridé ou très peu de mémoire : on bascule sur le rendu CSS.
  if (saveData || memory <= 2 || cores <= 2) return "low";
  // Tactile ou petit écran : WebGL, mais allégé.
  if (coarse || narrow || cores <= 4) return "medium";
  return "high";
}

/** Le diagnostic ne change pas en cours de session : on le mémorise. */
let cachedTier: DeviceTier | null = null;
const neverChanges = () => () => {};

export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(
    neverChanges,
    () => (cachedTier ??= computeTier()),
    // Rendu serveur : on suppose le pire, le client corrigera à l'hydratation.
    () => "low" as DeviceTier,
  );
}
