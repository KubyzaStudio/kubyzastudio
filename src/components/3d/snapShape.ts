import * as THREE from "three";

/**
 * LA SILHOUETTE
 * ==========================================================================
 * Le fantôme n'est pas une image posée sur un plan : c'est un contour
 * vectoriel qu'on extrude et qu'on biseaute. Le maillage obtenu a une
 * vraie épaisseur, de vraies arêtes, et accroche la lumière comme une
 * pièce taillée — c'est toute la différence avec une icône.
 *
 * Le dessin a été resserré sur les trois signes qui font qu'on reconnaît
 * ce fantôme et aucun autre :
 *   · un dôme large et franc, presque un demi-cercle ;
 *   · deux flancs verticaux, pas un ovale ;
 *   · trois festons profonds en bas, séparés par deux échancrures nettes.
 * Les ergots latéraux, eux, ont été raccourcis : trop longs, ils faisaient
 * lire une chauve-souris.
 *
 * Repère : hauteur ≈ 2 unités, largeur ≈ 1,6 unité, origine au centre.
 */
function outline(): THREE.Shape {
  const s = new THREE.Shape();

  // Le dôme, d'un seul geste, jusqu'au flanc droit.
  s.moveTo(0, 1.0);
  s.bezierCurveTo(0.45, 1.0, 0.79, 0.68, 0.79, 0.18);

  // Le flanc : rigoureusement vertical. C'est lui qui distingue un
  // fantôme d'une goutte.
  s.lineTo(0.79, -0.16);

  // L'ergot droit : court, anguleux, il casse la verticale.
  s.bezierCurveTo(0.88, -0.2, 0.99, -0.31, 0.94, -0.44);
  s.bezierCurveTo(0.9, -0.53, 0.82, -0.48, 0.73, -0.53);

  // Les festons : trois pointes, deux échancrures franches.
  s.bezierCurveTo(0.66, -0.57, 0.61, -0.91, 0.49, -0.91);
  s.bezierCurveTo(0.37, -0.91, 0.34, -0.62, 0.24, -0.62);
  s.bezierCurveTo(0.13, -0.62, 0.12, -0.97, 0.0, -0.97);
  s.bezierCurveTo(-0.12, -0.97, -0.13, -0.62, -0.24, -0.62);
  s.bezierCurveTo(-0.34, -0.62, -0.37, -0.91, -0.49, -0.91);
  s.bezierCurveTo(-0.61, -0.91, -0.66, -0.57, -0.73, -0.53);

  // L'ergot gauche, en miroir.
  s.bezierCurveTo(-0.82, -0.48, -0.9, -0.53, -0.94, -0.44);
  s.bezierCurveTo(-0.99, -0.31, -0.88, -0.2, -0.79, -0.16);

  s.lineTo(-0.79, 0.18);
  s.bezierCurveTo(-0.79, 0.68, -0.45, 1.0, 0, 1.0);

  return s;
}

/**
 * Le fantôme extrudé.
 * `curveSegments` élevé : sur une pièce de verre, un contour facetté se
 * voit immédiatement dans les reflets.
 */
export function createSnapGeometry(depth = 0.34, quality = 1) {
  const geometry = new THREE.ExtrudeGeometry(outline(), {
    depth,
    curveSegments: Math.round(20 * quality) + 8,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.055,
    bevelOffset: 0,
    bevelSegments: Math.round(4 * quality) + 2,
  });

  // L'extrusion part de z = 0 : on la recentre pour que l'objet tourne
  // autour de son propre axe et non autour de sa face arrière.
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}
