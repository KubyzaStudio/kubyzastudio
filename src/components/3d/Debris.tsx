"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SUN } from "./Body";

const vertexShader = /* glsl */ `
uniform float uTime;

attribute vec3 aAxis;
attribute float aSpeed;
attribute float aPhase;

varying vec3 vNormalW;
varying float vDepth;
varying float vShade;

/* Rotation autour d'un axe arbitraire (Rodrigues).
   Faire culbuter les débris ici coûte zéro : aucun recalcul de matrice
   côté CPU, quel que soit le nombre de fragments. */
mat3 rotate(vec3 axis, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  float t = 1.0 - c;
  return mat3(
    t * axis.x * axis.x + c,          t * axis.x * axis.y - s * axis.z, t * axis.x * axis.z + s * axis.y,
    t * axis.x * axis.y + s * axis.z, t * axis.y * axis.y + c,          t * axis.y * axis.z - s * axis.x,
    t * axis.x * axis.z - s * axis.y, t * axis.y * axis.z + s * axis.x, t * axis.z * axis.z + c
  );
}

void main() {
  mat3 tumble = rotate(normalize(aAxis), uTime * aSpeed + aPhase);
  vec3 local = tumble * position;
  vec3 n = tumble * normal;

  vec4 worldPos = modelMatrix * instanceMatrix * vec4(local, 1.0);
  vNormalW = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * n);

  vec4 mv = viewMatrix * worldPos;
  vDepth = -mv.z;
  vShade = aPhase;
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3  uLightDir;
uniform vec3  uColor;
uniform vec3  uRim;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3  uFogColor;

varying vec3 vNormalW;
varying float vDepth;
varying float vShade;

void main() {
  vec3 N = normalize(vNormalW);
  float lambert = max(dot(N, normalize(uLightDir)), 0.0);

  /* Facettes franches : le fragment est un caillou, pas une bille. */
  vec3 color = uColor * (0.08 + lambert * 0.95) * (0.7 + vShade * 0.5);
  color += uRim * pow(lambert, 12.0) * 0.5;

  float fog = smoothstep(uFogNear, uFogFar, vDepth);
  color = mix(color, uFogColor, fog * 0.92);

  gl_FragColor = vec4(color, 1.0 - fog * 0.7);
}
`;

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type DebrisProps = {
  count: number;
  /** Étendue du champ : largeur, hauteur, profondeur. */
  spread: [number, number, number];
  scale?: number;
  color?: string;
  rim?: string;
  seed?: number;
  fogColor: THREE.Color;
  fogNear?: number;
  fogFar?: number;
};

/**
 * Champ de débris.
 *
 * Un seul appel de rendu pour plusieurs centaines de fragments.
 * La position et la taille vivent dans la matrice d'instance ;
 * la culbute est calculée dans le shader — le CPU ne touche à rien
 * une fois le champ semé.
 */
export function Debris({
  count,
  spread,
  scale = 1,
  color = "#5c6480",
  rim = "#9fb4e8",
  seed = 12,
  fogColor,
  fogNear = 60,
  fogFar = 240,
}: DebrisProps) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);

  const attributes = useMemo(() => {
    const random = seeded(seed);
    const axes = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      axes[i * 3] = random() * 2 - 1;
      axes[i * 3 + 1] = random() * 2 - 1;
      axes[i * 3 + 2] = random() * 2 - 1;
      speeds[i] = 0.12 + random() * 0.55;
      phases[i] = random();
    }
    return { axes, speeds, phases };
  }, [count, seed]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLightDir: { value: SUN },
      uColor: { value: new THREE.Color(color) },
      uRim: { value: new THREE.Color(rim) },
      uFogNear: { value: fogNear },
      uFogFar: { value: fogFar },
      uFogColor: { value: fogColor },
    }),
    [color, rim, fogNear, fogFar, fogColor],
  );

  useLayoutEffect(() => {
    if (!mesh.current) return;
    const random = seeded(seed + 977);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      // Distribution en couronne creuse : le couloir de vol reste dégagé,
      // les fragments passent de part et d'autre du regard.
      const angle = random() * Math.PI * 2;
      const radius = 0.35 + Math.pow(random(), 0.7) * 0.65;
      dummy.position.set(
        Math.cos(angle) * radius * spread[0],
        Math.sin(angle) * radius * spread[1],
        (random() - 0.5) * spread[2],
      );
      const s = scale * (0.25 + Math.pow(random(), 2.4) * 1.8);
      dummy.scale.set(s, s * (0.6 + random() * 0.7), s * (0.7 + random() * 0.6));
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;

    const geo = mesh.current.geometry;
    geo.setAttribute("aAxis", new THREE.InstancedBufferAttribute(attributes.axes, 3));
    geo.setAttribute("aSpeed", new THREE.InstancedBufferAttribute(attributes.speeds, 1));
    geo.setAttribute("aPhase", new THREE.InstancedBufferAttribute(attributes.phases, 1));
  }, [count, spread, scale, seed, attributes]);

  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      {/* Icosaèdre sans subdivision : 20 faces, et des normales déjà
          planes — chaque facette accroche la lumière séparément. */}
      <icosahedronGeometry args={[1, 0]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
      />
    </instancedMesh>
  );
}
