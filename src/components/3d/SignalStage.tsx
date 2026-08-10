"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SnapArtifact, type ArtifactPhase } from "./SnapArtifact";

type SignalStageProps = {
  opened: boolean;
  onOpen: () => void;
  onHoverChange: (hovering: boolean) => void;
  detail?: number;
  /** Animation d'appel : levée tant que le visiteur n'a jamais touché l'objet. */
  attention?: boolean;
  /**
   * Compteur de demandes venues de l'extérieur — la commande posée sous
   * l'objet. Chaque incrément déclenche le même éclat qu'un clic sur le
   * verre : il n'y a qu'une seule ouverture possible, et elle part
   * toujours de l'objet.
   */
  request?: number;
};

/**
 * Le seul canvas du site qui reçoive des clics.
 *
 * Le décor général est un fond : il est `pointer-events: none` et ne doit
 * jamais intercepter quoi que ce soit. Ici, au contraire, l'objet est
 * l'interface — il lui faut sa propre scène, sa propre caméra et son
 * propre raycaster.
 *
 * ==========================================================================
 * POURQUOI LE PANNEAU SE ROUVRAIT TOUT SEUL
 * ==========================================================================
 * L'ouverture était déclarée comme un ÉTAT (« la phase vaut `open` ») et
 * l'effet qui prévenait le parent avait cet état pour dépendance, aux côtés
 * de la fonction `onOpen`. Or `onOpen` était une lambda écrite directement
 * dans le JSX du parent : une nouvelle fonction à chaque rendu.
 *
 * L'enchaînement était donc mécanique, et il se reproduisait à l'identique
 * à chaque fois :
 *
 *   1. le visiteur ferme  →  `opened` passe à `false` ;
 *   2. la section se rend à nouveau  →  `onOpen` change d'identité ;
 *   3. l'effet, voyant sa dépendance changer, se rejoue — la phase, elle,
 *      vaut encore `open` pendant les 320 ms de recomposition de l'objet ;
 *   4. il repose sa temporisation et rappelle `onOpen` 140 ms plus tard.
 *
 * Le panneau se rouvrait donc systématiquement, et aucun délai n'y aurait
 * rien changé : le défaut n'était pas dans les durées, il était dans la
 * nature de la chose. Une ouverture n'est pas un état continu, c'est un
 * ÉVÉNEMENT — il se produit une fois, à la fin de l'éclat, et jamais parce
 * qu'un composant s'est rendu.
 *
 * Ici l'annonce est donc émise depuis la transition elle-même, protégée par
 * un verrou qui ne se relâche qu'au retour à l'état de repos. Aucun rendu,
 * aucune identité de fonction, aucune horloge ne peut plus la déclencher.
 */
export function SignalStage({
  opened,
  onOpen,
  onHoverChange,
  detail = 1,
  attention = false,
  request = 0,
}: SignalStageProps) {
  const [phase, setPhase] = useState<ArtifactPhase>("idle");

  /** Verrou d'ouverture : levé à l'éclat, baissé au retour au repos. */
  const announced = useRef(false);
  const breath = useRef<number | null>(null);

  const activate = useCallback(() => {
    if (announced.current) return;
    setPhase((current) => (current === "idle" ? "burst" : current));
  }, []);

  // Fin de l'éclat : l'objet a disparu, l'écran est vide. Un souffle, puis
  // la révélation — c'est ce vide qui fait qu'on la remarque.
  const handleBurstEnd = useCallback(() => {
    if (announced.current) return;
    announced.current = true;
    setPhase("open");
    breath.current = window.setTimeout(() => {
      breath.current = null;
      onOpen();
    }, 140);
  }, [onOpen]);

  // La commande extérieure emprunte exactement le même chemin que le clic
  // sur le verre : un incrément, un éclat. `activate` étant stable, l'effet
  // ne se rejoue jamais pour une autre raison que la demande elle-même.
  useEffect(() => {
    if (request > 0) activate();
  }, [request, activate]);

  /*
    Le panneau refermé, l'objet se reforme et le verrou retombe.

    Les deux conditions comptent autant l'une que l'autre :
    · `phase !== "open"` — pendant l'éclat aussi, `opened` vaut encore
      `false`. Sans ce test, la recomposition se déclencherait au milieu de
      l'éclat et annulerait l'ouverture qu'elle est censée suivre.
    · `breath.current` — entre la fin de l'éclat et l'apparition du panneau,
      il s'écoule un souffle de 140 ms pendant lequel la phase vaut déjà
      `open` sans que `opened` ait eu le temps de basculer. On ne défait pas
      une ouverture qui n'a pas encore eu lieu.
  */
  useEffect(() => {
    if (opened || phase !== "open" || breath.current !== null) return;
    const id = window.setTimeout(() => {
      announced.current = false;
      setPhase("idle");
    }, 320);
    return () => window.clearTimeout(id);
  }, [opened, phase]);

  useEffect(
    () => () => {
      if (breath.current) window.clearTimeout(breath.current);
    },
    [],
  );

  const [cursor, setCursor] = useState(false);
  const handleHover = useCallback(
    (hovering: boolean) => {
      setCursor(hovering);
      onHoverChange(hovering);
    },
    [onHoverChange],
  );

  return (
    <div
      className="absolute inset-0"
      // Panneau ouvert : la scène cesse d'exister pour le pointeur. Aucun
      // clic destiné au panneau ne peut atteindre l'objet qui est derrière.
      style={{ pointerEvents: opened ? "none" : undefined }}
      // Le curseur maison réagit déjà ; ce marqueur lui dit que
      // l'objet est cliquable comme le serait un lien.
      data-cursor={cursor ? "hover" : undefined}
    >
      <Canvas
        dpr={[1, detail >= 1 ? 1.75 : 1.25]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        camera={{ position: [0, 0, 6.2], fov: 42, near: 0.1, far: 40 }}
      >
        <Suspense fallback={null}>
          <SnapArtifact
            phase={phase}
            onActivate={activate}
            onBurstEnd={handleBurstEnd}
            onHover={handleHover}
            detail={detail}
            attention={attention}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
