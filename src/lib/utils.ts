import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * `tailwind-merge` ne connaît que les utilitaires natifs. Sans cette
 * déclaration, il prend `type-heading` pour une couleur de texte et le
 * supprime au profit de `text-star` — les titres perdent leur taille.
 * Nos utilitaires maison sont donc rattachés à leur groupe de conflit.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ type: ["display", "heading"] }],
      "text-color": [{ type: ["luminous"] }],
      "font-family": ["label-mono"],
    },
  },
});

/** Fusionne des classes Tailwind sans conflit. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Borne une valeur entre min et max. */
export function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

/** Interpolation linéaire. */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Remappe une valeur d'un intervalle vers [0,1], bornée. */
export function progress(value: number, start: number, end: number) {
  if (end === start) return 0;
  return clamp((value - start) / (end - start));
}

/** Formate un montant en euros, sans décimales. */
export function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}
