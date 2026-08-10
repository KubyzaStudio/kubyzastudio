"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { simplex3d, fbm } from "./shaders/noise";
import { SUN } from "./Body";

const vertexShader = /* glsl */ `
varying vec3 vRel;
varying float vDepth;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);

  // Position exprimée en RAYONS PLANÉTAIRES, dans le repère du monde.
  //   · le centre de la planète est la translation de la matrice modèle ;
  //   · l'échelle du groupe parent EST le rayon de la planète.
  // C'est ce changement de repère qui permet de comparer l'anneau à la
  // direction du soleil : le disque est incliné, un calcul en coordonnées
  // locales placerait l'ombre à côté de la planète.
  vec3 center = modelMatrix[3].xyz;
  float radius = length(modelMatrix[0].xyz);
  vRel = (worldPos.xyz - center) / max(radius, 0.0001);

  vec4 mv = viewMatrix * worldPos;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3  uColor;
uniform vec3  uColorEdge;
uniform vec3  uLightDir;
uniform float uInner;
uniform float uOuter;
uniform float uOpacity;
uniform float uSeed;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3  uFogColor;

varying vec3 vRel;
varying float vDepth;

${simplex3d}
${fbm}

void main() {
  float r = length(vRel);
  float t = (r - uInner) / max(uOuter - uInner, 0.0001);
  if (t < 0.0 || t > 1.0) discard;

  /* Structure fine : des milliers d'anneaux, pas un ruban plat.
     Deux échelles superposées — les grandes divisions, puis le grain. */
  float coarse = fbm(vec3(t * 9.0 + uSeed, 0.0, 0.0));
  float fine = fbm(vec3(t * 58.0 + uSeed, 0.0, 0.0));
  float density = smoothstep(-0.45, 0.55, coarse * 0.8 + fine * 0.45);

  /* Division de Cassini : un vide net, c'est ce qui rend l'anneau crédible. */
  density *= 1.0 - 0.92 * exp(-pow((t - 0.46) / 0.035, 2.0));

  /* Les bords se dissolvent, jamais de découpe franche. */
  float edges = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.82, 1.0, t));

  /* Ombre portée de la planète : le cylindre d'ombre projeté par le corps
     le long du soleil. Sans elle, l'anneau flotte au lieu d'appartenir au
     corps — c'est ce détail qui fait qu'on croit à la même échelle. */
  vec3 L = normalize(uLightDir);
  float along = dot(vRel, L);
  float perp = length(vRel - L * along);
  float shade = 1.0;
  if (along < 0.0) {
    // Le rayon de la planète vaut 1 dans ce repère : la pénombre s'étale
    // juste au-delà du limbe.
    shade = mix(0.14, 1.0, smoothstep(0.94, 1.18, perp));
  }

  vec3 color = mix(uColor, uColorEdge, t);
  float alpha = density * edges * uOpacity * shade;

  float fog = smoothstep(uFogNear, uFogFar, vDepth);
  color = mix(color, uFogColor, fog * 0.9);
  alpha *= 1.0 - fog * 0.55;

  gl_FragColor = vec4(color * (0.4 + shade * 0.75), alpha);
}
`;

type RingsProps = {
  /** Rayons, exprimés en rayons planétaires. */
  inner: number;
  outer: number;
  color: string;
  colorEdge: string;
  opacity?: number;
  /** Inclinaison du plan de l'anneau. */
  tilt?: [number, number, number];
  seed?: number;
  octaves: number;
  fogColor: THREE.Color;
  fogNear?: number;
  fogFar?: number;
};

/**
 * Un système d'anneaux.
 *
 * Un seul disque, une seule passe : la structure, les divisions et
 * l'ombre portée de la planète sont entièrement calculées dans le shader.
 * Rendu des deux côtés, sans écriture de profondeur — on voit l'anneau
 * passer devant et derrière le corps.
 */
export function Rings({
  inner,
  outer,
  color,
  colorEdge,
  opacity = 0.85,
  tilt = [Math.PI / 2.6, 0, 0.2],
  seed = 0,
  octaves,
  fogColor,
  fogNear = 90,
  fogFar = 320,
}: RingsProps) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uColorEdge: { value: new THREE.Color(colorEdge) },
      uLightDir: { value: SUN },
      uInner: { value: inner },
      uOuter: { value: outer },
      uOpacity: { value: opacity },
      uSeed: { value: seed },
      uFogNear: { value: fogNear },
      uFogFar: { value: fogFar },
      uFogColor: { value: fogColor },
    }),
    [color, colorEdge, inner, outer, opacity, seed, fogNear, fogFar, fogColor],
  );

  const fragment = useMemo(
    () => `#define OCTAVES ${Math.min(octaves, 4)}\n${fragmentShader}`,
    [octaves],
  );

  // Rotation très lente du plan : l'anneau vit sans qu'on le remarque.
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.z += delta * 0.006;
  });

  return (
    <group ref={group} rotation={tilt}>
      <mesh>
        <ringGeometry args={[inner, outer, 128, 1]} />
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragment}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </mesh>
    </group>
  );
}
