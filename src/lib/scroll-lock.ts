/**
 * VERROUILLAGE DU DÉFILEMENT PENDANT QU'UNE MODALE EST OUVERTE
 * ============================================================================
 * POURQUOI `overflow: hidden` NE SUFFIT PAS ICI
 * ----------------------------------------------------------------------------
 * C'est la recette habituelle, et sur un site ordinaire elle fonctionne. Ce
 * site n'est pas ordinaire : `ExperienceProvider` installe Lenis, qui ne se
 * contente pas d'accompagner le défilement natif — il le REMPLACE. Lenis
 * intercepte l'événement `wheel`, appelle `preventDefault()`, puis déplace la
 * page lui-même en appelant `scrollTo` à chaque frame.
 *
 * Or `overflow: hidden` interdit le défilement *de l'utilisateur*, pas le
 * défilement *programmatique* : `scrollTo` traverse la règle sans la voir. La
 * molette continuait donc à faire glisser la page derrière la modale, et
 * `overflow: hidden` ne bloquait plus que le clavier.
 *
 * La seule façon d'arrêter Lenis est de le lui demander : `lenis.stop()`.
 * Encore faut-il pouvoir l'atteindre — l'instance vivait enfermée dans l'effet
 * qui la crée. Ce module est le point de rendez-vous, sur le modèle de
 * `viewport-state.ts` : un singleton hors de React, qui ne déclenche aucun
 * rendu.
 *
 * LE COMPTEUR
 * ----------------------------------------------------------------------------
 * `depth` plutôt qu'un booléen. Deux panneaux ouverts en même temps, ou un
 * effet React remonté avant d'être nettoyé (ce que le mode strict provoque
 * volontairement en développement), et un simple booléen rendrait le
 * défilement à la fermeture du premier — laissant la page défiler sous la
 * modale encore ouverte. On ne déverrouille qu'au retour à zéro.
 */

/** La part de Lenis qui nous intéresse — pas de dépendance de type au paquet. */
type SmoothScroller = {
  stop: () => void;
  start: () => void;
};

let scroller: SmoothScroller | null = null;
let depth = 0;

/** Styles à remettre exactement comme ils étaient, jamais « vidés ». */
let previousOverflow = "";
let previousPaddingRight = "";
let restoreScrollY = 0;

/**
 * Appelé par `ExperienceProvider` à la naissance et à la mort de Lenis.
 *
 * Le cas `depth > 0` n'est pas théorique : Lenis est importé de façon
 * asynchrone, donc une modale peut très bien s'ouvrir avant qu'il n'existe.
 * Il arriverait alors en marche sous une modale déjà ouverte.
 */
export function registerSmoothScroller(instance: SmoothScroller | null): void {
  scroller = instance;
  if (instance && depth > 0) instance.stop();
}

/**
 * Fige la page. Retourne la fonction qui la libère — appelable sans risque
 * plusieurs fois, ce qui la rend utilisable telle quelle comme nettoyage
 * d'un `useEffect`.
 */
export function lockScroll(): () => void {
  const root = document.documentElement;

  if (depth === 0) {
    restoreScrollY = window.scrollY;
    previousOverflow = root.style.overflow;
    previousPaddingRight = root.style.paddingRight;

    /* La barre de défilement disparaît avec `overflow: hidden`, et toute la
       page se décale de sa largeur — un saut horizontal très visible au
       moment précis où l'attention se porte sur la modale. On rend cette
       largeur sous forme de marge. Elle vaut 0 sur les navigateurs à barre
       flottante (mobile, macOS par défaut) : rien n'est ajouté pour rien. */
    const scrollbar = window.innerWidth - root.clientWidth;
    if (scrollbar > 0) {
      const current = parseFloat(getComputedStyle(root).paddingRight) || 0;
      root.style.paddingRight = `${current + scrollbar}px`;
    }

    root.style.overflow = "hidden";
    scroller?.stop();
  }

  depth += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    depth = Math.max(0, depth - 1);
    if (depth > 0) return;

    // L'ordre compte : rendre la page défilable AVANT de la repositionner,
    // sinon la correction de position est refusée puis perdue.
    root.style.overflow = previousOverflow;
    root.style.paddingRight = previousPaddingRight;

    /* Filet de sécurité. `overflow: hidden` conserve normalement la position,
       mais un redimensionnement ou un changement de hauteur du document
       pendant que la modale était ouverte peut l'avoir écrêtée. */
    if (window.scrollY !== restoreScrollY) {
      window.scrollTo({ top: restoreScrollY, behavior: "instant" as ScrollBehavior });
    }

    // Lenis repart après coup : il relit la position réelle au redémarrage.
    scroller?.start();
  };
}
