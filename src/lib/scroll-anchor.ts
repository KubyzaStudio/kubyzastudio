/**
 * LE POINT DE DÉPART
 * ==========================================================================
 * Pourquoi la page ne commençait pas en haut — la cause, pas le symptôme.
 *
 * Le navigateur mémorise la position de défilement et la RESTAURE tout seul
 * (`history.scrollRestoration === "auto"`, la valeur par défaut) au
 * rechargement, au retour arrière et à la sortie du cache bfcache. Cette
 * restauration se produit APRÈS l'analyse du document, souvent après le
 * premier rendu React — donc après le préchargeur, qui bloque justement le
 * défilement (`overflow: hidden`). Résultat : la page s'ouvrait tantôt en
 * haut, tantôt à mi-course, selon l'ordre dans lequel ces trois horloges
 * tombaient. Un `window.scrollTo(0, 0)` posé dans un effet React aurait
 * couru contre la même horloge, en arrivant systématiquement trop tard, et
 * aurait cassé toute arrivée volontaire sur une ancre.
 *
 * La correction se fait donc en amont : on retire au navigateur le droit de
 * restaurer, avant qu'il ne peigne quoi que ce soit. Ce script est injecté
 * en tête de `<body>` et s'exécute pendant l'analyse du document — il n'y a
 * plus de course, il n'y a plus de restauration.
 *
 * L'ancre volontaire reste souveraine : si l'URL porte un `#section`, on ne
 * touche à rien et c'est Lenis qui s'y rend (voir `ExperienceProvider`).
 */
export const SCROLL_ANCHOR_SCRIPT = `
(function () {
  try {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    var atAnchor = function () { return location.hash.length > 1; };
    if (!atAnchor()) window.scrollTo(0, 0);

    // Dès que le visiteur agit, ce garde-fou se retire pour de bon : il
    // n'est là que pour le tout premier instant de la page, jamais pour
    // reprendre la main sur un défilement voulu.
    var touched = false;
    var release = function () { touched = true; };
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) {
      addEventListener(type, release, { passive: true, once: true });
    });

    // Certains navigateurs tentent la restauration au moment où la mise en
    // page atteint la hauteur mémorisée, c'est-à-dire potentiellement après
    // ce script. Le chargement complet est le dernier instant où l'on peut
    // constater le résultat — et le corriger si personne n'a rien demandé.
    addEventListener("load", function () {
      if (!touched && !atAnchor()) window.scrollTo(0, 0);
    });

    // Retour depuis le cache arrière/avant : le document n'est pas rejoué,
    // seul cet événement nous prévient.
    addEventListener("pageshow", function (event) {
      if (event.persisted && !atAnchor()) window.scrollTo(0, 0);
    });
  } catch (error) {}
})();
`;
