"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { simplex3d, fbm } from "./shaders/noise";
import type { Ambience } from "./chapters";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uTravel;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform float uIntensity;
uniform float uEdge;

varying vec2 vUv;

${simplex3d}
${fbm}

void main() {
  vec2 uv = vUv - 0.5;

  // La troisième coordonnée est la distance parcourue : on ne regarde pas
  // un nuage qui s'anime, on avance à l'intérieur de lui. Deux nappes de
  // vitesses différentes évitent le motif qui se répète.
  vec3 p1 = vec3(uv * 2.4, uTime * 0.01 + uTravel * 0.010);
  vec3 p2 = vec3(uv * 1.05 + 4.7, uTime * 0.006 - uTravel * 0.006);

  float n1 = fbm(p1) * 0.5 + 0.5;
  float n2 = fbm(p2) * 0.5 + 0.5;
  float cloud = pow(n1 * n2, 1.85);

  // Fondu radial : la nébuleuse ne touche jamais les bords de l'écran.
  float falloff = smoothstep(uEdge, 0.06, length(uv));

  vec3 color = mix(uColorA, uColorB, n2);
  float alpha = cloud * falloff * uIntensity;

  gl_FragColor = vec4(color, alpha);
}
`;

type NebulaProps = {
  octaves: number;
  ambience: Ambience;
  /** Distance devant la caméra à laquelle la nappe se tient. */
  distance?: number;
  /** Taille de la nappe et opacité de base. */
  scale?: number;
  strength?: number;
  edge?: number;
  seedOffset?: number;
};

/**
 * Une nappe de nébuleuse.
 *
 * Elle se tient à distance fixe devant la caméra et sa troisième
 * coordonnée de bruit avance avec le voyage : on la traverse réellement.
 * Sa couleur et sa densité sont dictées par le chapitre en cours — le
 * fond ne reste jamais le même deux sections de suite.
 */
export function Nebula({
  octaves,
  ambience,
  distance = 150,
  scale = 1,
  strength = 1,
  edge = 0.72,
  seedOffset = 0,
}: NebulaProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: seedOffset * 37 },
      uTravel: { value: 0 },
      uColorA: { value: new THREE.Color("#1b2a63") },
      uColorB: { value: new THREE.Color("#3a2a6b") },
      uIntensity: { value: 0.3 },
      uEdge: { value: edge },
    }),
    [edge, seedOffset],
  );

  const fragment = useMemo(
    () => `#define OCTAVES ${octaves}\n${fragmentShader}`,
    [octaves],
  );

  useFrame((state, delta) => {
    if (!material.current || !mesh.current) return;
    const u = material.current.uniforms;
    const { camera } = state;

    u.uTime.value += delta;
    u.uTravel.value = -camera.position.z;

    // Amortissement : la couleur du vide se déplace sans qu'on voie
    // le moment où elle change.
    u.uColorA.value.lerp(ambience.nebulaA, 0.035);
    u.uColorB.value.lerp(ambience.nebulaB, 0.035);
    u.uIntensity.value +=
      (ambience.density * strength - u.uIntensity.value) * 0.035;

    mesh.current.position.set(
      camera.position.x * 0.35,
      camera.position.y * 0.35,
      camera.position.z - distance,
    );
  });

  return (
    <mesh ref={mesh} renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[430 * scale, 300 * scale]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragment}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
