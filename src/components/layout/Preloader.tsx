"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Étoiles déterministes.
 * ==========================================================================
 * L'ERREUR D'HYDRATATION VENAIT D'ICI, et il faut nommer sa cause exacte :
 * `size` était un NOMBRE (`0.8 + depth * 1.6`), passé tel quel à `style`.
 *
 * React sérialise un nombre en lui collant « px » à pleine précision :
 * le serveur écrivait `width:1.4353562186282944px`. Le navigateur, lui,
 * reparse cette longueur et la restitue arrondie — `1.43536px`. Les deux
 * représentations ne coïncident plus, et React signale la divergence.
 *
 * La correction ne masque rien : elle supprime la possibilité même d'un
 * écart. Aucune valeur numérique n'entre plus dans `style`, et les
 * dimensions sont des ENTIERS de pixels — une longueur entière est la
 * seule qu'aucun moteur ne réécrit. Les pourcentages de position sont
 * figés à trois décimales, exactement comme dans `StaticSky`.
 */
const STARS = Array.from({ length: 46 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233) * 12345.6789;
  const c = Math.sin(i * 4.198) * 7351.221;
  const depth = c - Math.floor(c);
  return {
    left: `${((a - Math.floor(a)) * 100).toFixed(3)}%`,
    top: `${((b - Math.floor(b)) * 100).toFixed(3)}%`,
    // 1, 2 ou 3 pixels : trois tailles suffisent à faire un ciel.
    size: `${1 + Math.round(depth * 2)}px`,
    // Un délai en secondes n'est pas une longueur : le moteur ne le
    // reparse pas, deux décimales sont sûres.
    delay: `${(depth * 4).toFixed(2)}s`,
  };
});

const PHASES = [
  "Initialisation de la mission",
  "Calibrage des instruments",
  "Lancement en cours",
] as const;

const TOTAL_MS = 2600;

export function Preloader({ onDone }: { onDone: () => void }) {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(true);
  const [percent, setPercent] = useState(0);
  const [phase, setPhase] = useState(0);
  const finished = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      sessionStorage.setItem("kubyza:launched", "1");
      document.documentElement.style.overflow = "";
      setVisible(false);
      onDone();

      // Pendant le préchargement, `overflow: hidden` fige la hauteur du
      // document : tout ce qui a mesuré la page entre-temps — au premier
      // rang le défilement horizontal épinglé du constat — a mesuré faux.
      // Un événement de redimensionnement suffit à tout faire remesurer,
      // sans que ce composant ait à connaître GSAP.
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    };

    // Vu une fois par session, ou mouvement réduit : on ne fait pas patienter.
    // Le report d'une microtâche évite un rendu en cascade au montage.
    const seen = sessionStorage.getItem("kubyza:launched") === "1";
    if (seen || reduced) {
      queueMicrotask(finish);
      return;
    }

    document.documentElement.style.overflow = "hidden";
    const start = performance.now();

    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / TOTAL_MS);
      // Easing : démarrage franc, palier, puis complétion nette.
      const eased = 1 - Math.pow(1 - t, 2.4);
      setPercent(Math.round(eased * 100));
      setPhase(t < 0.35 ? 0 : t < 0.72 ? 1 : 2);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        // On laisse le "100 %" respirer une demi-seconde avant l'ouverture.
        window.setTimeout(finish, 420);
      }
    };
    frame = requestAnimationFrame(tick);

    // Filet de sécurité : jamais plus de 4 secondes, quoi qu'il arrive.
    const failsafe = window.setTimeout(finish, 4000);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(failsafe);
      document.documentElement.style.overflow = "";
    };
  }, [onDone, reduced]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden bg-void"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            filter: "blur(14px)",
            transition: { duration: 0.9, ease: [0.83, 0, 0.17, 1] },
          }}
        >
          {/* Champ d'étoiles : la profondeur avant même l'entrée en scène. */}
          <div aria-hidden="true" className="absolute inset-0">
            {STARS.map((star, i) => (
              <span
                key={i}
                className="absolute rounded-full bg-star animate-breathe"
                style={{
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                  animationDelay: star.delay,
                }}
              />
            ))}
          </div>

          {/* Lueur bleue qui monte, comme une mise à feu lointaine. */}
          <motion.div
            aria-hidden="true"
            className="absolute bottom-[-30%] h-[70vh] w-[140vw] rounded-[50%] bg-accent/18 blur-[120px]"
            initial={{ opacity: 0.15, scale: 0.85 }}
            animate={{ opacity: 0.5, scale: 1.05 }}
            transition={{ duration: 2.6, ease: [0.16, 1, 0.3, 1] }}
          />

          <div className="relative z-1 flex w-full max-w-md flex-col items-center px-8">
            <motion.p
              className="font-display text-[clamp(1.5rem,7vw,2.5rem)] leading-none font-medium tracking-[0.16em] text-star uppercase"
              initial={{ opacity: 0, letterSpacing: "0.5em", filter: "blur(12px)" }}
              animate={{ opacity: 1, letterSpacing: "0.16em", filter: "blur(0px)" }}
              transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            >
              Kubyza
            </motion.p>
            <motion.p
              className="label-mono mt-3 text-dim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              Studio
            </motion.p>

            <div className="mt-14 w-full">
              <div className="mb-3 flex items-baseline justify-between">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={phase}
                    className="font-mono text-[0.6875rem] tracking-[0.18em] text-mist uppercase"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.4 }}
                  >
                    {PHASES[phase]}
                  </motion.span>
                </AnimatePresence>
                <span className="font-mono text-[0.6875rem] tabular-nums text-accent-soft">
                  {String(percent).padStart(3, "0")}%
                </span>
              </div>

              <div className="h-px w-full overflow-hidden bg-ink">
                <div
                  className="h-full bg-linear-to-r from-accent to-accent-glow shadow-[0_0_14px_1px_rgba(110,151,255,0.8)]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Télémétrie discrète, en bas de l'écran. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-8 flex justify-center gap-8 font-mono text-[0.625rem] tracking-[0.2em] text-dim uppercase"
          >
            <span>SYS · OK</span>
            <span className="tabular-nums">T-{(100 - percent).toString().padStart(3, "0")}</span>
            <span>77 · FR</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
