"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Starfield } from "./Starfield";
import { Nebula } from "./Nebula";
import { Body } from "./Body";
import { Rings } from "./Rings";
import { Debris } from "./Debris";
import { WORLDS, DEBRIS_FIELDS, type Placement } from "./world";
import { createAmbience, sampleAmbience, travelDepth } from "./chapters";
import type { QualityPreset } from "./quality";
import { viewportState } from "@/lib/viewport-state";
import { lerp } from "@/lib/utils";

/** Un monde et, s'il en a, son anneau et son satellite. */
function World({
  place,
  quality,
  fogColor,
}: {
  place: Placement;
  quality: QualityPreset;
  fogColor: THREE.Color;
}) {
  const moonPivot = useRef<THREE.Group>(null);

  // Les corps lointains ne méritent pas la même finesse que ceux qu'on frôle.
  const segments = place.radius > 6 ? quality.planetSegments : Math.max(32, quality.planetSegments * 0.7);

  useFrame((_, delta) => {
    if (moonPivot.current && place.moon) {
      moonPivot.current.rotation.y += delta * place.moon.speed;
    }
  });

  return (
    <group position={place.position}>
      <group scale={place.radius}>
        <Body
          {...place.spec}
          segments={Math.round(segments)}
          octaves={quality.octaves}
          fogColor={fogColor}
        />

        {place.rings && (
          <Rings
            {...place.rings}
            octaves={quality.octaves}
            fogColor={fogColor}
            seed={place.id.length * 7}
          />
        )}
      </group>

      {place.moon && (
        <group ref={moonPivot} rotation={[place.moon.inclination, 0, 0]}>
          <group
            position={[place.radius * place.moon.orbit, 0, 0]}
            scale={place.radius * place.moon.radius * 0.35}
          >
            <Body
              {...place.moon.spec}
              segments={32}
              octaves={Math.min(quality.octaves, 3)}
              fogColor={fogColor}
            />
          </group>
        </group>
      )}
    </group>
  );
}

/**
 * LA TRAVERSÉE
 * ==========================================================================
 * Une seule règle : la caméra avance, le monde ne bouge pas.
 *
 * Tout le reste en découle — les corps grandissent parce qu'on s'en
 * approche, les couches d'étoiles défilent à des vitesses différentes
 * parce qu'elles sont à des distances différentes, et la nébuleuse change
 * de couleur parce qu'on entre dans une autre région.
 */
export function SceneContent({ quality }: { quality: QualityPreset }) {
  const { gl, scene, camera } = useThree();
  const ambience = useMemo(() => createAmbience(), []);
  const lookTarget = useRef(new THREE.Vector3());
  const lastFov = useRef(52);

  const worlds = useMemo(
    () => (quality.allWorlds ? WORLDS : WORLDS.filter((w) => w.essential)),
    [quality.allWorlds],
  );

  const debrisFields = useMemo(
    () => (quality.debris > 0 ? DEBRIS_FIELDS : []),
    [quality.debris],
  );

  /**
   * Compilation anticipée de tous les programmes GLSL.
   * Sans cela, le premier corps qui entre dans le champ fait tomber une
   * frame entière pendant que son shader se compile — au milieu d'un
   * mouvement de caméra, ça se voit.
   */
  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      if (cancelled) return;
      void gl.compileAsync?.(scene, camera);
    }, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [gl, scene, camera]);

  useFrame((state, delta) => {
    const { camera, size } = state;
    // Amortissement indépendant du framerate.
    const damp = 1 - Math.pow(0.0015, Math.min(delta, 0.05));

    const scroll = viewportState.scroll;
    sampleAmbience(scroll, ambience);

    // --- Avancée : la seule chose qui bouge vraiment ------------------
    const depth = travelDepth(scroll);

    // En portrait, on recule un peu : les corps posés sur les côtés
    // resteraient hors cadre sur un écran étroit.
    const aspect = size.width / Math.max(size.height, 1);
    const pullBack = aspect < 1 ? 8 : aspect < 1.4 ? 4 : 0;

    let targetX = ambience.driftX;
    let targetY = ambience.driftY;

    if (quality.pointerParallax) {
      // Parallaxe souris : quelques dixièmes d'unité, jamais plus.
      targetX += viewportState.pointerX * 0.9;
      targetY += -viewportState.pointerY * 0.6;
    }

    camera.position.x = lerp(camera.position.x, targetX, damp * 0.5);
    camera.position.y = lerp(camera.position.y, targetY, damp * 0.5);
    camera.position.z = lerp(camera.position.z, 14 - depth - pullBack, damp * 0.7);

    // --- Regard : porté loin devant, il pivote dans les virages -------
    lookTarget.current.set(
      ambience.driftX * 0.45 + viewportState.pointerX * 0.5,
      ambience.driftY * 0.4 - viewportState.pointerY * 0.3,
      camera.position.z - 60,
    );
    camera.lookAt(lookTarget.current);

    // Roulis : le vaisseau s'incline. C'est infime, et c'est ce qui fait
    // qu'on ne regarde pas un diaporama.
    camera.rotation.z += ambience.roll;

    // --- Focale : elle se resserre dans les moments d'attention -------
    if (Math.abs(ambience.fov - lastFov.current) > 0.02) {
      lastFov.current = lerp(lastFov.current, ambience.fov, damp * 0.25);
      (camera as THREE.PerspectiveCamera).fov = lastFov.current;
      camera.updateProjectionMatrix();
    }
  });

  return (
    <>
      {/* Deux nappes de nébuleuse : l'une lointaine et large, l'autre plus
          proche et plus resserrée. Leur décalage crée un vrai volume. */}
      <Nebula
        octaves={Math.min(quality.octaves, 4)}
        ambience={ambience}
        distance={170}
        scale={1.25}
        strength={1}
        edge={0.78}
      />
      {quality.nebulaLayers > 1 && (
        <Nebula
          octaves={Math.min(quality.octaves, 3)}
          ambience={ambience}
          distance={72}
          scale={0.55}
          strength={0.5}
          edge={0.6}
          seedOffset={3}
        />
      )}

      <Starfield counts={quality.starLayers} ambient={ambience.ambient} />

      {worlds.map((place) => (
        <World
          key={place.id}
          place={place}
          quality={quality}
          fogColor={ambience.nebulaA}
        />
      ))}

      {debrisFields.map((field) => (
        <group key={field.id} position={field.position}>
          <Debris
            count={quality.debris}
            spread={field.spread}
            scale={field.scale}
            color={field.color}
            rim={field.rim}
            seed={field.seed}
            fogColor={ambience.nebulaA}
          />
        </group>
      ))}
    </>
  );
}
