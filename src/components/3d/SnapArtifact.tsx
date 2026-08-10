"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { createSnapGeometry } from "./snapShape";
import { clamp, lerp } from "@/lib/utils";

/**
 * Le jaune est le seul indice de marque que l'objet accepte. Il n'est pas
 * décoratif : c'est lui qui fait qu'on reconnaît le fantôme avant même
 * d'avoir lu le mot « Snapchat ». Le verre bleu nuit de la version
 * précédente était plus élégant — et parfaitement illisible sur un fond
 * noir.
 */
const GOLD = "#ffc529";
const GOLD_SOFT = "#ffe9a8";
const SNAP_YELLOW = "#ffd400";

/* ------------------------------------------------------------------ *
 * Le halo — la preuve que l'objet éclaire, et n'est pas juste éclairé.
 * ------------------------------------------------------------------ */

const haloFragment = /* glsl */ `
uniform vec3  uColor;
uniform float uStrength;
varying vec2 vUv;

void main() {
  float d = length(vUv - 0.5) * 2.0;
  // Deux lobes : un cœur dense, une diffusion très large.
  float core = pow(max(1.0 - d, 0.0), 5.0);
  float bloom = pow(max(1.0 - d, 0.0), 1.5) * 0.4;
  gl_FragColor = vec4(uColor, (core + bloom) * uStrength);
}
`;

const haloVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

function Halo({ intensity }: { intensity: React.RefObject<number> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(GOLD_SOFT) },
      uStrength: { value: 0 },
    }),
    [],
  );

  useFrame((state) => {
    if (!mesh.current || !material.current) return;
    // Panneau publicitaire : il fait toujours face à la caméra.
    mesh.current.quaternion.copy(state.camera.quaternion);
    const pulse = 0.86 + Math.sin(state.clock.elapsedTime * 1.4) * 0.14;
    material.current.uniforms.uStrength.value = intensity.current * pulse;
  });

  return (
    <mesh ref={mesh} position={[0, 0, -0.4]} renderOrder={-1}>
      <planeGeometry args={[9, 9]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={haloVertex}
        fragmentShader={haloFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ *
 * L'éclat — ce qui se passe au clic.
 * ------------------------------------------------------------------ */

const burstVertex = /* glsl */ `
uniform float uProgress;
uniform float uPixelRatio;

attribute vec3 aDirection;
attribute float aSpeed;
attribute float aSize;

varying float vAlpha;

void main() {
  // Départ franc puis freinage : une projection, pas une expansion.
  float eased = 1.0 - pow(1.0 - uProgress, 2.6);
  vec3 pos = position + aDirection * eased * aSpeed;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixelRatio * (34.0 / max(-mv.z, 1.0)) * (1.0 - eased * 0.55);

  // Naissance immédiate, extinction lente.
  vAlpha = smoothstep(0.0, 0.06, uProgress) * (1.0 - smoothstep(0.35, 1.0, uProgress));
}
`;

const burstFragment = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(uColor, core * vAlpha);
}
`;

function Burst({
  progress,
  count = 420,
}: {
  progress: React.RefObject<number>;
  count?: number;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const points = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const directions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const sizes = new Float32Array(count);

    let seed = 5731;
    const random = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    for (let i = 0; i < count; i++) {
      // Direction uniforme sur la sphère, puis aplatie : l'éclat part
      // surtout de côté, comme une onde, et non comme un feu d'artifice.
      const theta = random() * Math.PI * 2;
      const z = random() * 2 - 1;
      const r = Math.sqrt(1 - z * z);
      directions[i * 3] = Math.cos(theta) * r;
      directions[i * 3 + 1] = Math.sin(theta) * r * 0.8;
      directions[i * 3 + 2] = z * 0.45;

      const start = 0.35 + random() * 0.4;
      positions[i * 3] = directions[i * 3] * start;
      positions[i * 3 + 1] = directions[i * 3 + 1] * start;
      positions[i * 3 + 2] = directions[i * 3 + 2] * start;

      speeds[i] = 2.4 + Math.pow(random(), 1.8) * 9;
      sizes[i] = 1.2 + Math.pow(random(), 2.5) * 4.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aDirection", new THREE.BufferAttribute(directions, 3));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    if (!material.current || !points.current) return;
    material.current.uniforms.uProgress.value = progress.current;
    material.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    points.current.visible = progress.current > 0.001 && progress.current < 0.999;
  });

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uPixelRatio: { value: 1 },
      uColor: { value: new THREE.Color(GOLD_SOFT) },
    }),
    [],
  );

  return (
    <points ref={points} geometry={geometry} frustumCulled={false} visible={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={burstVertex}
        fragmentShader={burstFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** L'onde de choc : deux anneaux plats qui s'ouvrent et s'effacent. */
function Shockwave({ progress }: { progress: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!group.current) return;
    const p = progress.current;
    group.current.visible = p > 0.001 && p < 0.999;
    if (!group.current.visible) return;

    group.current.quaternion.copy(state.camera.quaternion);

    const wave = (offset: number, mesh: THREE.Mesh | null) => {
      if (!mesh) return;
      const local = clamp((p - offset) / (1 - offset));
      const eased = 1 - Math.pow(1 - local, 3);
      mesh.scale.setScalar(0.2 + eased * 9);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - local) * 0.8 * (local > 0 ? 1 : 0);
    };

    wave(0, a.current);
    wave(0.16, b.current);
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={a}>
        <ringGeometry args={[0.86, 1, 96]} />
        <meshBasicMaterial
          color={GOLD_SOFT}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={b}>
        <ringGeometry args={[0.93, 1, 96]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ *
 * L'artefact.
 * ------------------------------------------------------------------ */

export type ArtifactPhase = "idle" | "burst" | "open";

type SnapArtifactProps = {
  phase: ArtifactPhase;
  onActivate: () => void;
  onBurstEnd: () => void;
  onHover: (hovering: boolean) => void;
  /** Géométrie et particules allégées sur les appareils modestes. */
  detail?: number;
  /**
   * Sans souris, rien ne signale qu'un objet est vivant. Quand ce drapeau
   * est levé, l'artefact s'appelle lui-même : une oscillation lente et une
   * pulsation de lumière toutes les trois secondes. Il retombe dès que le
   * visiteur a touché l'objet une première fois.
   */
  attention?: boolean;
};

const BURST_SECONDS = 1.15;

export function SnapArtifact({
  phase,
  onActivate,
  onBurstEnd,
  onHover,
  detail = 1,
  attention = false,
}: SnapArtifactProps) {
  const pivot = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const coreMaterial = useRef<THREE.MeshBasicMaterial>(null);

  const glow = useRef(0.55);
  const burst = useRef(0);
  const settled = useRef(0);
  const hovered = useRef(false);
  /** L'éclat est terminé : on ne prévient qu'une fois, jamais à chaque image. */
  const announced = useRef(false);
  const { invalidate } = useThree();

  const geometry = useMemo(() => createSnapGeometry(0.34, detail), [detail]);
  const coreGeometry = useMemo(() => createSnapGeometry(0.2, detail * 0.6), [detail]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      coreGeometry.dispose();
    };
  }, [geometry, coreGeometry]);

  // L'éclat repart de zéro à chaque déclenchement.
  useEffect(() => {
    if (phase === "burst") {
      burst.current = 0.0001;
      announced.current = false;
      invalidate();
    }
    if (phase === "idle") {
      burst.current = 0;
      announced.current = false;
    }
  }, [phase, invalidate]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const damp = 1 - Math.pow(0.002, Math.min(delta, 0.05));

    // --- L'éclat -----------------------------------------------------
    if (phase === "burst" && burst.current > 0) {
      burst.current = Math.min(1, burst.current + delta / BURST_SECONDS);
      if (burst.current >= 1 && !announced.current) {
        announced.current = true;
        onBurstEnd();
      }
    }

    /* --- L'appel ------------------------------------------------------
       Une impulsion brève toutes les 3,4 secondes : l'objet bascule d'un
       quart de tour sur lui-même, sa lumière monte, puis tout retombe.
       C'est l'équivalent tactile du survol — sans lui, sur téléphone,
       l'objet a l'air d'un décor. */
    const beat =
      attention && phase === "idle"
        ? Math.pow(Math.max(0, Math.sin((t % 3.4) * Math.PI * 0.62)), 6)
        : 0;

    // --- Flottement, rotation, réaction à la souris -------------------
    if (pivot.current) {
      const pointerX = state.pointer.x;
      const pointerY = state.pointer.y;

      pivot.current.position.y = Math.sin(t * 0.62) * 0.16 + beat * 0.1;
      pivot.current.position.x = Math.sin(t * 0.41 + 1.2) * 0.08;

      // La rotation propre reste lente ; la souris ne fait qu'incliner.
      const spin = t * (phase === "open" ? 0.1 : 0.24);
      const targetYaw = spin + pointerX * 0.55 + beat * 0.9;
      const targetPitch = -pointerY * 0.42 + Math.sin(t * 0.5) * 0.05;

      pivot.current.rotation.y = lerp(pivot.current.rotation.y, targetYaw, damp * 0.35);
      pivot.current.rotation.x = lerp(pivot.current.rotation.x, targetPitch, damp * 0.35);
      pivot.current.rotation.z = lerp(
        pivot.current.rotation.z,
        pointerX * -0.12 - beat * 0.16,
        damp * 0.3,
      );
    }

    // --- Échelle : recul avant l'éclat, effacement après --------------
    if (shell.current) {
      let target = hovered.current ? 1.06 : 1 + beat * 0.05;
      if (phase === "burst") {
        const p = burst.current;
        // Inspiration (compression), puis expulsion, puis disparition.
        target = p < 0.18 ? 1 - p * 1.6 : 1 + Math.pow((p - 0.18) / 0.82, 0.6) * 0.9;
      }
      if (phase === "open") target = 0;

      settled.current = lerp(settled.current, target, damp * (phase === "idle" ? 0.4 : 0.75));
      shell.current.scale.setScalar(Math.max(settled.current, 0));
      shell.current.visible = settled.current > 0.02;
    }

    // --- La lumière émise ---------------------------------------------
    let targetGlow = hovered.current ? 1.15 : 0.6 + beat * 0.55;
    if (phase === "burst") {
      const p = burst.current;
      targetGlow = p < 0.2 ? 0.6 + p * 14 : Math.max(0, 3.4 - (p - 0.2) * 4.2);
    }
    if (phase === "open") targetGlow = 0.34;

    glow.current = lerp(glow.current, targetGlow, damp * 0.6);

    if (light.current) light.current.intensity = glow.current * 26;
    if (coreMaterial.current) {
      coreMaterial.current.opacity = clamp(glow.current * 0.85, 0, 1);
    }
  });

  return (
    <group ref={pivot}>
      {/*
        Un environnement fabriqué sur place : quatre panneaux lumineux
        rendus une fois dans une cube map. Aucun fichier HDR à télécharger,
        et pourtant du vrai reflet dans le verre.
      */}
      <Environment resolution={192} frames={1}>
        <Lightformer intensity={3.4} color="#ffe6b0" position={[-3, 2.5, 3]} scale={[6, 6, 1]} />
        <Lightformer intensity={1.6} color="#6e97ff" position={[4, -1.5, 2]} scale={[5, 5, 1]} />
        <Lightformer intensity={2.2} color="#ffffff" position={[0, 4, -3]} scale={[8, 2, 1]} />
        <Lightformer intensity={0.9} color="#3d6bff" position={[0, -4, -2]} scale={[8, 3, 1]} />
      </Environment>

      <Halo intensity={glow} />
      <Burst progress={burst} count={Math.round(420 * detail)} />
      <Shockwave progress={burst} />

      {/* La lumière que l'objet projette autour de lui. */}
      <pointLight ref={light} color={GOLD} distance={14} decay={2} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-4, 5, 6]} intensity={1.6} color="#dce8ff" />

      <group ref={shell}>
        {/* La pièce de verre. */}
        <mesh
          geometry={geometry}
          onClick={(event) => {
            event.stopPropagation();
            if (phase === "idle") onActivate();
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            hovered.current = true;
            onHover(true);
          }}
          onPointerOut={() => {
            hovered.current = false;
            onHover(false);
          }}
        >
          {/* Verre jaune, pas plastique jaune : l'iridescence reste, mais
              sous une teinte qui nomme la marque. L'émission garantit que
              l'objet se lise même quand aucune lumière ne l'atteint. */}
          <meshPhysicalMaterial
            color={SNAP_YELLOW}
            emissive="#8a5c00"
            emissiveIntensity={0.55}
            roughness={0.05}
            metalness={0.02}
            clearcoat={1}
            clearcoatRoughness={0.03}
            ior={1.55}
            reflectivity={0.92}
            iridescence={0.45}
            iridescenceIOR={1.5}
            iridescenceThicknessRange={[120, 620]}
            envMapIntensity={2.2}
            transparent
            opacity={0.88}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Le cœur incandescent, vu à travers le verre. */}
        <mesh geometry={coreGeometry} scale={0.78}>
          <meshBasicMaterial
            ref={coreMaterial}
            color={GOLD}
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Arête de lumière : le liseré dessine le contour du fantôme.
            C'est lui qui rend la silhouette lisible de loin — il est donc
            franc, et non plus un voile à 10 %. */}
        <mesh geometry={geometry} scale={1.022}>
          <meshBasicMaterial
            color="#fff4c2"
            transparent
            opacity={0.26}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
