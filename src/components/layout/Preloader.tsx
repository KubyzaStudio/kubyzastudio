"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useIsTouch, usePrefersReducedMotion } from "@/lib/hooks";

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

/**
 * L'ÉCRAN DE LANCEMENT N'EXISTE PAS SUR TÉLÉPHONE
 * ==========================================================================
 * Il durait 2 600 ms, plus 420 ms de palier à « 100 % » : trois secondes
 * d'écran noir imposées à chaque première visite. Sur un grand écran c'est
 * une mise en scène — le panneau se lève, l'habitacle s'allume. Au doigt,
 * c'était exactement ce que les visiteurs décrivaient comme « le site est
 * lent à charger ». Le décor n'y était pour rien : la page était prête
 * depuis longtemps, on la retenait.
 *
 * Il a d'abord été raccourci à 850 ms au doigt. À l'usage, sur un vrai
 * téléphone, le verdict a été net : à cette durée on ne voit plus la mise en
 * scène, on ne perçoit qu'un délai. Une animation qu'on n'a pas le temps de
 * lire n'est plus une animation — c'est une attente.
 *
 * Sur téléphone, le site s'ouvre donc directement sur le hero. Sur
 * ordinateur, le compte à rebours est conservé DANS SA DURÉE D'ORIGINE :
 * 2 600 ms de séquence, puis 420 ms de palier à « 100 % ». C'est le temps
 * qu'il faut pour que les trois phases se lisent et que la barre ait un
 * sens ; l'écourter revenait à garder le décor en lui retirant sa raison
 * d'être.
 *
 * Ce que cela coûte est assumé et cantonné : sur grand écran, le hero reste
 * couvert le temps de la séquence. Ce n'a jamais été là que se posait le
 * problème — la lenteur signalée était celle du téléphone, et le téléphone
 * n'a plus d'écran de lancement du tout.
 *
 * L'escamotage mobile se joue à DEUX endroits, et les deux sont nécessaires :
 *
 *   · en CSS (`.preloader` dans `globals.css`), pour que rien ne soit peint
 *     avant même que le JavaScript arrive — sans quoi l'écran noir
 *     apparaîtrait le temps de l'hydratation, ce qui reviendrait à le
 *     garder sous une autre forme ;
 *   · ici, pour que `launched` bascule immédiatement et que le reste du
 *     hero entre en scène sans attendre un compte à rebours qui ne
 *     s'affiche plus.
 */
const TOTAL_DESKTOP_MS = 2600;
/** Palier de respiration après « 100 % », avant l'ouverture. */
const HOLD_MS = 420;

export function Preloader({ onDone }: { onDone: () => void }) {
  const reduced = usePrefersReducedMotion();
  const isTouch = useIsTouch();
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

    // Téléphone, seconde visite de la session, ou mouvement réduit : on ne
    // fait patienter personne. Le report d'une microtâche évite un rendu en
    // cascade au montage.
    const seen = sessionStorage.getItem("kubyza:launched") === "1";
    if (isTouch || seen || reduced) {
      queueMicrotask(finish);
      return;
    }

    document.documentElement.style.overflow = "hidden";
    const total = TOTAL_DESKTOP_MS;
    const start = performance.now();

    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / total);
      // Easing : démarrage franc, palier, puis complétion nette.
      const eased = 1 - Math.pow(1 - t, 2.4);
      setPercent(Math.round(eased * 100));
      setPhase(t < 0.35 ? 0 : t < 0.72 ? 1 : 2);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        // On laisse le « 100 % » se poser un instant avant l'ouverture.
        window.setTimeout(finish, HOLD_MS);
      }
    };
    frame = requestAnimationFrame(tick);

    // Filet de sécurité : la séquence complète, son palier, et une seconde
    // de marge. Un onglet mis en arrière-plan gèle `rAF` — sans ce filet, le
    // visiteur qui revient trouverait l'écran de lancement figé.
    // Le calcul suit les constantes : changer la durée du compte à rebours
    // ne peut plus laisser le filet en dessous de lui.
    const failsafe = window.setTimeout(finish, total + HOLD_MS + 1000);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(failsafe);
      document.documentElement.style.overflow = "";
    };
  }, [onDone, reduced, isTouch]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          className="preloader fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden bg-void"
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

          {/* Lueur bleue qui monte, comme une mise à feu lointaine.
              Le rayon du flou est le geste le plus cher de tout l'écran de
              lancement : il s'applique à une boîte de 140 vw sur 70 vh, et
              c'est justement l'instant où le téléphone a le plus à faire.
              70 px au lieu de 120 px sur petit écran : la lueur garde sa
              forme et son étalement — elle coûte trois fois moins. */}
          <motion.div
            aria-hidden="true"
            className="absolute bottom-[-30%] h-[70vh] w-[140vw] rounded-[50%] bg-accent/18 blur-[70px] sm:blur-[120px]"
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
