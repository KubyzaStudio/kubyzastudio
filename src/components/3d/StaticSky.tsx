"use client";

import { cn } from "@/lib/utils";

/**
 * Étoiles déterministes : identiques au rendu serveur, aucune hydratation
 * cassée. Même règle que dans le préchargement — les LONGUEURS sont des
 * entiers de pixels. Une longueur fractionnaire est reparsée puis
 * réécrite par le moteur, et le texte obtenu ne correspond plus à celui
 * qu'a produit le serveur. Durées et opacités, elles, ne sont pas des
 * longueurs : elles peuvent garder leurs décimales.
 */
const STARS = Array.from({ length: 110 }, (_, i) => {
  const r = (n: number) => {
    const v = Math.sin(i * n) * 43758.5453;
    return v - Math.floor(v);
  };
  const depth = r(4.7);
  return {
    left: (r(12.9898) * 100).toFixed(3),
    top: (r(78.233) * 100).toFixed(3),
    size: 1 + Math.round(depth * 2),
    opacity: (0.18 + depth * 0.72).toFixed(2),
    duration: (4 + r(31.7) * 7).toFixed(2),
    delay: (r(9.13) * 8).toFixed(2),
    blue: r(52.7) > 0.72,
  };
});

type StaticSkyProps = {
  /** `false` quand le champ d'étoiles WebGL prend le relais. */
  stars?: boolean;
  className?: string;
};

/**
 * Ciel en CSS pur.
 *
 * Deux rôles : socle de couleur sous la scène WebGL, et remplacement complet
 * sur les appareils modestes ou en mouvement réduit. Aucun JavaScript par frame.
 */
export function StaticSky({ stars = true, className }: StaticSkyProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none inset-0 overflow-hidden",
        className ?? "fixed -z-10",
      )}
    >
      {/* Le vide : jamais un noir plat. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,#0d1430_0%,#06090f_45%,#04050a_100%)]" />

      {/* Nébuleuses lointaines. */}
      <div className="absolute -top-[15%] -left-[10%] h-[70vh] w-[70vw] rounded-full bg-[#243a8c]/22 blur-[130px]" />
      <div className="absolute top-[35%] -right-[15%] h-[60vh] w-[65vw] rounded-full bg-[#3a2a6b]/20 blur-[140px]" />
      <div className="absolute -bottom-[20%] left-[15%] h-[55vh] w-[70vw] rounded-full bg-[#1a2f7a]/18 blur-[150px]" />

      {stars && (
        <div className="absolute inset-0">
          {STARS.map((star, i) => (
            <span
              key={i}
              className={cn(
                "absolute rounded-full",
                star.blue ? "bg-accent-glow" : "bg-star",
              )}
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                animation: `breathe ${star.duration}s cubic-bezier(0.83,0,0.17,1) ${star.delay}s infinite`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
