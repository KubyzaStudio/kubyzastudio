"use client";

import { useEffect } from "react";
import { viewportState } from "@/lib/viewport-state";
import { registerSmoothScroller } from "@/lib/scroll-lock";
import { usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Pilote unique du mouvement du site.
 *
 * - Lenis lisse le scroll et devient la source de vérité.
 * - GSAP ScrollTrigger est synchronisé sur la même horloge (aucun décalage).
 * - `viewportState` alimente la scène 3D sans provoquer de rendu React.
 *
 * Lenis et GSAP sont importés dans l'effet, jamais au module : ils quittent
 * ainsi le bundle critique et n'entrent pas dans le temps de blocage initial.
 */
export function ExperienceProvider({ children }: { children: React.ReactNode }) {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    let disposed = false;
    let dispose = () => {};

    // L'URL décide, et elle seule : une ancre explicite est une intention
    // de l'utilisateur, tout le reste démarre au début du voyage.
    const requestedAnchor = () => {
      const hash = window.location.hash;
      if (hash.length < 2) return null;
      try {
        return document.querySelector<HTMLElement>(hash);
      } catch {
        return null;
      }
    };

    // Mouvement réduit : scroll natif, on se contente de mesurer.
    if (reduced) {
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        viewportState.scroll = max > 0 ? window.scrollY / max : 0;
      };
      const target = requestedAnchor();
      if (target) target.scrollIntoView();
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    void (async () => {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] =
        await Promise.all([
          import("lenis"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);

      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({
        duration: 1.15,
        // Courbe expo-out : la page glisse puis se pose, sans rebond.
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        // Le scroll tactile natif reste le plus fluide sur mobile.
        syncTouch: false,
        touchMultiplier: 1.6,
      });

      // Lenis tient son propre compteur de position. S'il naît alors que la
      // page est encore à mi-course — ou s'il rate la remise à zéro faite
      // avant le rendu — il croit que le voyage a déjà commencé. On aligne
      // les deux horloges dès l'instanciation, sans animation : ce n'est pas
      // un déplacement, c'est une déclaration de point de départ.
      const anchor = requestedAnchor();
      if (anchor) {
        lenis.scrollTo(anchor, { offset: -12, immediate: true, force: true });
      } else {
        lenis.scrollTo(0, { immediate: true, force: true });
      }

      /* Seule façon d'arrêter le défilement quand une modale s'ouvre : Lenis
         déplace la page par programme, ce qu'`overflow: hidden` ne bloque
         pas. Voir `src/lib/scroll-lock.ts`. */
      registerSmoothScroller(lenis);

      lenis.on("scroll", ({ progress, velocity }: typeof lenis) => {
        viewportState.scroll = progress;
        viewportState.velocity = velocity;
        ScrollTrigger.update();
      });

      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      // Les ancres passent par Lenis pour garder le même easing partout.
      const onAnchorClick = (event: MouseEvent) => {
        const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>(
          'a[href^="#"]',
        );
        const hash = anchor?.getAttribute("href");
        if (!anchor || !hash || hash === "#") return;
        const target = document.querySelector(hash);
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target as HTMLElement, { offset: -12, duration: 1.4 });
        history.replaceState(null, "", hash);
      };
      document.addEventListener("click", onAnchorClick);

      /*
        Deux remesures changent la hauteur du document après coup : le
        déverrouillage du préchargeur, puis l'arrivée de la police
        d'affichage qui élargit la piste horizontale du constat. Chacune
        peut décaler la position courante de quelques pixels.

        Tant que le visiteur n'a rien fait, on repose donc le point de
        départ après remesure. Dès qu'il touche à la molette, au clavier
        ou à l'écran, ce filet se retire définitivement : plus jamais rien
        ne déplace la page à sa place.
      */
      let untouched = !anchor;
      const release = () => {
        untouched = false;
      };
      const settle = () => {
        ScrollTrigger.refresh();
        if (untouched) lenis.scrollTo(0, { immediate: true, force: true });
      };

      for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) {
        window.addEventListener(type, release, { passive: true, once: true });
      }

      // Les sections apparaissent après le chargement : on remesure une fois.
      settle();
      void document.fonts?.ready.then(() => {
        if (!disposed) settle();
      });
      const settleTimer = window.setTimeout(settle, 1200);

      dispose = () => {
        window.clearTimeout(settleTimer);
        for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) {
          window.removeEventListener(type, release);
        }
        document.removeEventListener("click", onAnchorClick);
        gsap.ticker.remove(raf);
        registerSmoothScroller(null);
        lenis.destroy();
      };
    })();

    return () => {
      disposed = true;
      dispose();
    };
  }, [reduced]);

  // Curseur et visibilité de l'onglet : lus directement par la scène 3D.
  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      viewportState.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      viewportState.pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    };
    const onVisibility = () => {
      viewportState.visible = document.visibilityState === "visible";
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <>{children}</>;
}
