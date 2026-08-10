"use client";

import { useEffect, useState } from "react";
import { site } from "@/data/site";

export type JourneyState = {
  /** Index de l'étape en cours dans `site.journey`. */
  index: number;
  /** Progression totale du voyage, sur [0,1]. */
  progress: number;
  /** `true` tant qu'on n'a pas quitté l'écran d'ouverture. */
  atStart: boolean;
};

/**
 * Où en est le visiteur dans le voyage.
 *
 * L'étape courante est déduite d'un `IntersectionObserver` : c'est la
 * section qui occupe le milieu de l'écran qui gagne, pas celle qui touche
 * le haut. Un observateur ne coûte rien — mesurer les positions au scroll
 * en coûterait à chaque frame.
 *
 * La progression, elle, reste lue au scroll, mais dans un `rAF` : on ne
 * déclenche jamais plus d'un rendu par frame, et seulement quand la
 * valeur affichée change vraiment.
 */
export function useJourney(): JourneyState {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [atStart, setAtStart] = useState(true);

  useEffect(() => {
    const sections = site.journey
      .map((step, i) => {
        const el = document.querySelector(step.href);
        return el ? { el, i } : null;
      })
      .filter((entry): entry is { el: Element; i: number } => entry !== null);

    if (sections.length === 0) return;

    const visible = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const match = sections.find((s) => s.el === entry.target);
          if (!match) continue;
          if (entry.isIntersecting) visible.set(match.i, entry.intersectionRatio);
          else visible.delete(match.i);
        }
        if (visible.size === 0) return;
        // La section la plus présente à l'écran l'emporte.
        let best = -1;
        let bestRatio = -1;
        for (const [i, ratio] of visible) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = i;
          }
        }
        if (best >= 0) setIndex(best);
      },
      {
        // La bande médiane de l'écran décide : c'est ce que l'œil lit.
        rootMargin: "-38% 0px -38% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const { el } of sections) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let frame = 0;
    let lastPercent = -1;
    let lastAtStart: boolean | null = null;

    const measure = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;

      // On n'informe React qu'au demi-pourcent près : la jauge ne perd
      // rien en fluidité, et le reste de l'arbre ne se rend jamais.
      const percent = Math.round(ratio * 200);
      if (percent !== lastPercent) {
        lastPercent = percent;
        setProgress(percent / 200);
      }

      const started = window.scrollY < window.innerHeight * 0.5;
      if (started !== lastAtStart) {
        lastAtStart = started;
        setAtStart(started);
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return { index, progress, atStart };
}
