"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { simplex3d, fbm } from "./shaders/noise";

/** Le soleil du système : une seule source, partagée par tous les corps. */
export const SUN = new THREE.Vector3(-0.72, 0.34, 0.6).normalize();

/**
 * Les identités possibles d'un corps céleste.
 * Chaque style compile sa propre branche de shader — on ne paie jamais
 * le coût des cinq autres.
 */
export const SURFACE = {
  ocean: 0,
  ice: 1,
  rock: 2,
  dark: 3,
  gas: 4,
  moon: 5,
} as const;

export type SurfaceKind = keyof typeof SURFACE;

const vertexShader = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vViewDir;
varying vec3 vObjPos;
varying float vDepth;

void main() {
  vObjPos = position;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  vec4 mv = viewMatrix * worldPos;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3  uLightDir;
uniform vec3  uLow;
uniform vec3  uHigh;
uniform vec3  uRim;
uniform float uRelief;
uniform float uGloss;
uniform float uEmissive;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3  uFogColor;

varying vec3 vNormalW;
varying vec3 vViewDir;
varying vec3 vObjPos;
varying float vDepth;

${simplex3d}
${fbm}

/*
  Bruit fractal court — deux octaves, rien de plus.
  ---------------------------------------------------------------------
  Le relief est échantillonné QUATRE fois par fragment : une fois pour la
  couleur, trois fois pour reconstruire la normale. À pleine résolution,
  une planète qui remplit l'écran coûterait plusieurs dizaines d'appels de
  bruit par pixel — c'est ce qui fait tomber une scène à 20 images par
  seconde sans qu'on comprenne pourquoi.
  Or la normale n'a pas besoin du détail fin : elle en tire un gradient,
  et le grain haute fréquence n'y produit que du bruit. Les trois
  échantillons de gradient utilisent donc cette version courte.
*/
float fbmLow(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 2; i++) {
    value += amplitude * snoise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

/* Bruit à crêtes : la signature des reliefs érodés et des cratères. */
float ridged(vec3 p) {
  float n = 1.0 - abs(fbm(p));
  return n * n;
}

float ridgedLow(vec3 p) {
  float n = 1.0 - abs(fbmLow(p));
  return n * n;
}

/* Champ d'altitude propre à chaque identité de planète. */
float elevation(vec3 p) {
#if SURFACE == 0
  /* Océan : de larges masses continentales, des côtes franches. */
  return fbm(p * 1.55 + vec3(0.0, uTime * 0.006, 0.0)) + fbm(p * 7.2) * 0.3;
#elif SURFACE == 1
  /* Glace : de vastes plaques lisses fracturées par des veines profondes. */
  float plates = fbm(p * 1.1);
  float cracks = 1.0 - smoothstep(0.0, 0.09, abs(fbm(p * 2.7)));
  return plates * 0.55 - cracks * 0.85 + fbm(p * 11.0) * 0.12;
#elif SURFACE == 2
  /* Roche : cratères empilés à trois échelles, aucun aplat. */
  return ridged(p * 1.9) * 1.15 + ridged(p * 5.3) * 0.4 + fbm(p * 14.0) * 0.16 - 0.6;
#elif SURFACE == 3
  /* Ombre : un relief réel, mais que la lumière ne révélera presque pas. */
  return ridged(p * 2.4) * 0.9 + fbm(p * 9.0) * 0.2 - 0.5;
#elif SURFACE == 4
  /* Géante gazeuse : des bandes de latitude que le vent cisaille. */
  float turbulence = fbm(vec3(p.x * 1.4, p.y * 0.7, p.z * 1.4) + vec3(uTime * 0.02, 0.0, 0.0));
  float bands = sin(p.y * 8.5 + turbulence * 3.4);
  return bands * 0.5 + turbulence * 0.35;
#else
  /* Lune : cratères serrés, régolithe. */
  return ridged(p * 3.4) * 0.9 + fbm(p * 16.0) * 0.22 - 0.45;
#endif
}

/* Le même champ, échantillonné court : réservé au calcul de la normale. */
float elevationLow(vec3 p) {
#if SURFACE == 0
  return fbmLow(p * 1.55);
#elif SURFACE == 1
  float plates = fbmLow(p * 1.1);
  float cracks = 1.0 - smoothstep(0.0, 0.09, abs(fbmLow(p * 2.7)));
  return plates * 0.55 - cracks * 0.85;
#elif SURFACE == 2
  return ridgedLow(p * 1.9) * 1.15 + ridgedLow(p * 5.3) * 0.4 - 0.6;
#elif SURFACE == 3
  return ridgedLow(p * 2.4) * 0.9 - 0.5;
#elif SURFACE == 4
  float turbulence = fbmLow(vec3(p.x * 1.4, p.y * 0.7, p.z * 1.4) + vec3(uTime * 0.02, 0.0, 0.0));
  return sin(p.y * 8.5 + turbulence * 3.4) * 0.5 + turbulence * 0.35;
#else
  return ridgedLow(p * 3.4) * 0.9 - 0.45;
#endif
}

void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(vViewDir);
  vec3 L = normalize(uLightDir);

  vec3 p = normalize(vObjPos);
  float height = elevation(p);

  /* Perturbation de la normale : du volume sans un seul polygone de plus.
     Les quatre échantillons du gradient viennent tous de elevationLow —
     mélanger les deux résolutions donnerait un gradient faux, et donc un
     ombrage qui contredit le relief qu'on vient de peindre. */
  float eps = 0.03;
  float base = elevationLow(p);
  float hx = elevationLow(p + vec3(eps, 0.0, 0.0));
  float hy = elevationLow(p + vec3(0.0, eps, 0.0));
  float hz = elevationLow(p + vec3(0.0, 0.0, eps));
  vec3 grad = vec3(hx - base, hy - base, hz - base) / eps;
  vec3 bump = normalize(N - (grad - dot(grad, N) * N) * uRelief * 0.02);

  float lambert = dot(bump, L);

#if SURFACE == 3
  /* Le corps sombre ne reçoit presque rien : c'est son sujet. */
  float day = smoothstep(0.05, 0.85, lambert) * 0.34;
#else
  float day = smoothstep(-0.2, 0.55, lambert);
#endif

#if SURFACE == 4
  vec3 albedo = mix(uLow, uHigh, smoothstep(-0.55, 0.75, height));
#else
  vec3 albedo = mix(uLow, uHigh, smoothstep(-0.35, 0.7, height));
#endif

  vec3 color = albedo * (0.05 + day * 0.95);

  /* Limbe : le liseré qui détache le corps du vide. */
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  color += uRim * rim * (0.2 + day * 0.9);

  /* Spéculaire — la glace brille, la roche non. */
  if (uGloss > 0.001) {
    float spec = pow(max(dot(reflect(-L, bump), V), 0.0), 26.0);
    color += uRim * spec * uGloss;
  }

  color += albedo * uEmissive;

  /* Fondu de distance : les corps lointains se dissolvent dans la nébuleuse
     au lieu de flotter comme des décalcomanies devant elle. */
  float fog = smoothstep(uFogNear, uFogFar, vDepth);
  color = mix(color, uFogColor, fog * 0.9);

  gl_FragColor = vec4(color, 1.0);
}
`;

const atmosphereVertex = /* glsl */ `
varying vec3 vNormalW;
varying vec3 vViewDir;

void main() {
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const atmosphereFragment = /* glsl */ `
uniform vec3  uColor;
uniform vec3  uLightDir;
uniform float uIntensity;

varying vec3 vNormalW;
varying vec3 vViewDir;

void main() {
  vec3 N = normalize(vNormalW);
  /* Exposant élevé : la lueur reste collée au limbe au lieu de former
     un second disque autour de la planète. */
  float fresnel = pow(1.0 - abs(dot(N, normalize(vViewDir))), 4.2);
  float lit = smoothstep(-0.5, 0.62, dot(N, normalize(uLightDir)));
  gl_FragColor = vec4(uColor, fresnel * lit * uIntensity);
}
`;

export type BodySpec = {
  surface: SurfaceKind;
  /** Couleur des creux. */
  low: string;
  /** Couleur des crêtes. */
  high: string;
  /** Teinte du limbe et de l'atmosphère. */
  rim: string;
  /** Amplitude du relief perçu. */
  relief?: number;
  /** 0 = mat, 1 = miroir. */
  gloss?: number;
  /** Lueur propre — un corps qui rayonne de lui-même. */
  emissive?: number;
  /** Épaisseur de l'atmosphère, en fraction du rayon. `0` = aucune. */
  atmosphere?: number;
  atmosphereIntensity?: number;
  /** Vitesse de rotation propre, en tours par seconde. */
  spin?: number;
  /** Inclinaison de l'axe, en radians. */
  tilt?: number;
  /**
   * Plafond d'octaves pour ce corps précis.
   * Un corps qui remplit l'écran paie son shader sur chaque pixel : on
   * lui retire du détail que personne ne verra de toute façon à cette
   * échelle, plutôt que d'appauvrir toute la scène.
   */
  maxOctaves?: number;
};

type BodyProps = BodySpec & {
  segments: number;
  octaves: number;
  /** Couleur vers laquelle le corps se dissout au loin. */
  fogColor: THREE.Color;
  fogNear?: number;
  fogFar?: number;
};

/**
 * Un corps céleste.
 *
 * Une sphère, un shader, et — si le corps en a une — une coque
 * d'atmosphère vue de l'intérieur. Rien d'autre : la variété vient
 * des paramètres, pas de l'empilement de maillages.
 */
export function Body({
  surface,
  low,
  high,
  rim,
  relief = 1,
  gloss = 0,
  emissive = 0,
  atmosphere = 0,
  atmosphereIntensity = 1.4,
  spin = 0.02,
  tilt = 0,
  maxOctaves,
  segments,
  octaves,
  fogColor,
  fogNear = 90,
  fogFar = 320,
}: BodyProps) {
  const core = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLightDir: { value: SUN },
      uLow: { value: new THREE.Color(low) },
      uHigh: { value: new THREE.Color(high) },
      uRim: { value: new THREE.Color(rim) },
      uRelief: { value: relief },
      uGloss: { value: gloss },
      uEmissive: { value: emissive },
      uFogNear: { value: fogNear },
      uFogFar: { value: fogFar },
      uFogColor: { value: fogColor },
    }),
    [low, high, rim, relief, gloss, emissive, fogNear, fogFar, fogColor],
  );

  const atmosphereUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(rim) },
      uLightDir: { value: SUN },
      uIntensity: { value: atmosphereIntensity },
    }),
    [rim, atmosphereIntensity],
  );

  // `SURFACE` et `OCTAVES` sont des constantes de compilation : elles
  // décident du coût réel du shader avant même qu'il tourne.
  const fragment = useMemo(() => {
    const count = Math.max(2, Math.min(octaves, maxOctaves ?? octaves));
    return `#define OCTAVES ${count}\n#define SURFACE ${SURFACE[surface]}\n${fragmentShader}`;
  }, [octaves, maxOctaves, surface]);

  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
    if (core.current) core.current.rotation.y += delta * spin;
  });

  return (
    <group rotation={[0, 0, tilt]}>
      <mesh ref={core}>
        <sphereGeometry args={[1, segments, Math.max(16, segments / 2)]} />
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragment}
        />
      </mesh>

      {atmosphere > 0 && (
        <mesh scale={1 + atmosphere}>
          <sphereGeometry
            args={[1, Math.max(28, segments / 2), Math.max(14, segments / 4)]}
          />
          <shaderMaterial
            uniforms={atmosphereUniforms}
            vertexShader={atmosphereVertex}
            fragmentShader={atmosphereFragment}
            transparent
            side={THREE.BackSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
}
