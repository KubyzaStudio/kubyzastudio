"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { viewportState } from "@/lib/viewport-state";

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
uniform float uDepth;
uniform float uSpeed;
uniform float uStretch;
uniform float uTravel;

attribute float aSize;
attribute float aPhase;
attribute float aTint;

varying float vAlpha;
varying float vTint;

void main() {
  vec3 pos = position;

  // Deux mouvements se cumulent avant le repliement :
  //   · uTime * uSpeed — la dérive propre de la couche ;
  //   · uTravel — la part du voyage que cette couche NE suit pas.
  // Une couche proche reste en arrière et défile ; une couche lointaine
  // accompagne la caméra et reste immobile. C'est là que naît la
  // profondeur : pas dans un flou, dans une vitesse relative.
  pos.z = mod(pos.z + uTime * uSpeed + uTravel, uDepth) - uDepth * 0.5;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Scintillement lent, décalé par étoile.
  float twinkle = 0.55 + 0.45 * sin(uTime * 0.9 + aPhase * 6.2831);

  // Fondu aux deux extrémités : aucune étoile n'apparaît ni ne disparaît brutalement.
  float depthFade = smoothstep(0.0, 0.18, 1.0 - abs(pos.z) / (uDepth * 0.5));

  // Une étoile qui frôle la caméra deviendrait une tache lumineuse énorme.
  // On la fait disparaître avant, et on plafonne sa taille à l'écran.
  float viewDepth = -mvPosition.z;
  float nearFade = smoothstep(1.5, 9.0, viewDepth);

  float size = aSize * uPixelRatio * (110.0 / max(viewDepth, 1.5)) * (1.0 + uStretch);
  gl_PointSize = min(size, 9.0 * uPixelRatio);

  vAlpha = twinkle * depthFade * nearFade;
  vTint = aTint;
}
`;

const fragmentShader = /* glsl */ `
uniform vec3 uColorCore;
uniform vec3 uColorGlow;
uniform float uOpacity;

varying float vAlpha;
varying float vTint;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;

  // Deux rayons : un cœur net, un halo diffus. C'est ce qui fait la lueur.
  // Le halo reste discret : au-delà, le champ d'étoiles mange le texte.
  float core = smoothstep(0.18, 0.02, d);
  float glow = smoothstep(0.5, 0.08, d) * 0.3;

  vec3 color = mix(uColorCore, uColorGlow, vTint);
  float alpha = (core + glow) * vAlpha * uOpacity;

  gl_FragColor = vec4(color, alpha);
}
`;

/**
 * Générateur pseudo-aléatoire déterministe (mulberry32).
 * `Math.random` rendrait la génération impure et le champ d'étoiles
 * différent à chaque rendu ; ici, une graine donne toujours le même ciel.
 */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type StarLayerProps = {
  seed: number;
  count: number;
  /** Profondeur du volume occupé par la couche. */
  depth: number;
  /** Rayon horizontal / vertical de dispersion. */
  spread: number;
  speed: number;
  size: number;
  opacity: number;
  /** Part du voyage que la couche accompagne. 1 = infiniment lointaine. */
  follow: number;
  /** Teinte chaude ou froide du ciel, pilotée par le chapitre. */
  ambient: THREE.Color;
};

/**
 * Une couche d'étoiles : un seul objet Three.js, un seul draw call.
 * Trois couches superposées créent la parallaxe de profondeur.
 */
function StarLayer({
  seed,
  count,
  depth,
  spread,
  speed,
  size,
  opacity,
  follow,
  ambient,
}: StarLayerProps) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const group = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const random = seeded(seed);
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const tints = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Distribution en disque : plus dense au centre du champ de vision.
      const angle = random() * Math.PI * 2;
      const radius = Math.pow(random(), 0.62) * spread;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius * 0.72;
      positions[i * 3 + 2] = (random() - 0.5) * depth;

      sizes[i] = size * (0.45 + Math.pow(random(), 2.2) * 1.9);
      phases[i] = random();
      // Une minorité d'étoiles tire vers le bleu : ça évite le champ uniforme.
      tints[i] = random() < 0.28 ? 0.55 + random() * 0.45 : random() * 0.25;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aTint", new THREE.BufferAttribute(tints, 1));
    return geo;
  }, [seed, count, depth, spread, size]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uDepth: { value: depth },
      uSpeed: { value: speed },
      uStretch: { value: 0 },
      uTravel: { value: 0 },
      uOpacity: { value: opacity },
      uColorCore: { value: new THREE.Color("#eaf0ff") },
      uColorGlow: { value: new THREE.Color("#7ea4ff") },
    }),
    [depth, speed, opacity],
  );

  useFrame((state, delta) => {
    if (!material.current || !group.current) return;
    const u = material.current.uniforms;
    const { camera } = state;

    u.uTime.value += delta;
    u.uPixelRatio.value = state.gl.getPixelRatio();

    // Le scroll rapide étire légèrement les étoiles : sensation de vitesse.
    const stretch = Math.min(Math.abs(viewportState.velocity) * 0.014, 0.55);
    u.uStretch.value += (stretch - u.uStretch.value) * 0.08;

    // Le volume d'étoiles reste centré sur la caméra ; seule la fraction
    // non suivie du voyage est injectée dans le repliement.
    group.current.position.set(camera.position.x, camera.position.y, camera.position.z);
    u.uTravel.value = (1 - follow) * -camera.position.z;

    // Les étoiles prennent la couleur du chapitre traversé.
    u.uColorGlow.value.lerp(ambient, 0.03);
  });

  return (
    <group ref={group}>
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/** Les trois couches : proches et rapides, intermédiaires, lointaines et lentes. */
export function Starfield({
  counts,
  ambient,
}: {
  counts: [number, number, number];
  ambient: THREE.Color;
}) {
  return (
    <group>
      <StarLayer seed={7} count={counts[0]} depth={70} spread={34} speed={1.1} size={1.7} opacity={0.62} follow={0.42} ambient={ambient} />
      <StarLayer seed={1301} count={counts[1]} depth={140} spread={58} speed={0.45} size={1.35} opacity={0.5} follow={0.74} ambient={ambient} />
      <StarLayer seed={90210} count={counts[2]} depth={240} spread={100} speed={0.14} size={1.05} opacity={0.36} follow={0.94} ambient={ambient} />
    </group>
  );
}
