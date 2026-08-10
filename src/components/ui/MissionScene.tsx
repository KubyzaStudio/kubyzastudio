"use client";

import { useEffect, useRef, useState } from "react";
import type { Project, SceneKey } from "@/data/projects";
import { ProjectPlanet } from "@/components/ui/ProjectPlanet";
import { useMediaQuery } from "@/lib/hooks";
import { cn } from "@/lib/utils";

/**
 * LE DÉCOR D'UNE MISSION
 * ==========================================================================
 * Un site publié se montre. Une mission en cours n'a rien à montrer — et
 * c'est précisément ce qu'il faut dessiner. Plutôt qu'un aperçu inventé ou
 * une carte grise portant « projet en cours », chaque mission non publiée
 * reçoit ici sa propre SCÈNE : un objet, une orbite, une mécanique.
 *
 * Quatre décors, quatre identités. Aucun n'est le même dessin recoloré :
 *
 *   industrial    — GG Artisan. Le site est en ligne : son vrai visuel est
 *                   la surface de la planète, cerclée d'une couronne
 *                   d'atelier graduée.
 *   mechanical    — KEYSPNEU77. Une roue : bande de roulement, jante,
 *                   moyeu boulonné. Le métier tient dans la forme.
 *   constellation — E-MULTISERVICE77. Un réseau de services : un noyau,
 *                   trois univers en orbite, des noeuds qui s'allument.
 *   shadow        — Paristanbul. Rien n'est construit : une armature vide
 *                   qu'une seule lueur traverse de temps à autre.
 *
 * COÛT — tout est en SVG, donc rien n'est rendu par le GPU. Reste le coût
 * des rotations : une scène hors champ est mise en pause par
 * `data-live`, et sur mobile les décors perdent leurs éléments les plus
 * fins. Les géométries sont calculées, jamais tirées au hasard : le rendu
 * serveur et le rendu client donnent exactement le même dessin.
 */

/**
 * Coordonnées d'un point sur un cercle. Le SVG est un carré de 200.
 *
 * L'arrondi n'est pas cosmétique, il est OBLIGATOIRE. `Math.cos` et
 * `Math.sin` ne sont pas tenus par la spécification de renvoyer le même
 * dernier bit d'une implémentation à l'autre : le V8 de Node et celui du
 * navigateur produisent `42.886844382503575` contre `42.88684438250356`
 * pour le même angle. React compare les attributs caractère par caractère
 * au moment de l'hydratation, et signalait donc un écart sur chaque crampon
 * de chaque décor. Deux décimales suffisent très largement dans un repère
 * de 200 unités, et rendent les deux rendus rigoureusement identiques.
 */
const round = (n: number) => Math.round(n * 100) / 100;

function polar(radius: number, degrees: number) {
  const rad = ((degrees - 90) * Math.PI) / 180;
  return {
    x: round(100 + radius * Math.cos(rad)),
    y: round(100 + radius * Math.sin(rad)),
  };
}

/** Une suite d'angles régulièrement répartis — déterministe. */
function spread(count: number, offset = 0) {
  return Array.from({ length: count }, (_, i) => offset + (i * 360) / count);
}

type SceneProps = {
  accent: string;
  hue: number;
  /** Le curseur est sur la mission, ou la carte est au centre de l'écran. */
  active: boolean;
  /** `false` sur mobile : on retire les éléments les plus fins. */
  dense: boolean;
  /**
   * Préfixe des identifiants de dégradé.
   *
   * Les `id` d'un SVG appartiennent au DOCUMENT, pas au SVG qui les porte :
   * quatre scènes déclarant toutes `shadow-beam` n'en laissent vivre qu'un
   * seul — le premier rencontré. La mission encore dans l'ombre héritait
   * ainsi du faisceau orange de KEYSPNEU77. Chaque scène nomme donc ses
   * dégradés d'après l'identifiant de son projet.
   */
  uid: string;
};

/* ==========================================================================
   MECHANICAL — KEYSPNEU77
   Une roue vue de face. La bande de roulement tourne, la jante contre-tourne,
   et l'arc de montage se referme sans jamais boucler : le site est construit,
   pas encore publié.
   ========================================================================== */
function Mechanical({ accent, active, dense, uid }: SceneProps) {
  const tread = spread(dense ? 32 : 20);
  const bolts = spread(5, 18);
  const spokes = spread(dense ? 10 : 6, 9);

  return (
    <>
      {/* Orbite de montage : le trait court, la mission avance. */}
      <circle
        cx="100"
        cy="100"
        r="93"
        fill="none"
        stroke={accent}
        strokeOpacity="0.28"
        strokeWidth="0.8"
        strokeDasharray="18 10"
        className="scene-dash"
        style={{ animationDuration: active ? "6s" : "14s" }}
      />

      {/* Boulons en orbite haute — trois éclats métalliques. */}
      <g
        className="scene-spin"
        style={{ animationDuration: active ? "24s" : "60s" }}
      >
        {spread(3, 30).map((angle) => {
          const p = polar(93, angle);
          return (
            <rect
              key={angle}
              x={p.x - 2.6}
              y={p.y - 2.6}
              width="5.2"
              height="5.2"
              rx="1"
              fill={accent}
              fillOpacity="0.85"
              transform={`rotate(${angle} ${p.x} ${p.y})`}
            />
          );
        })}
      </g>

      {/* Le pneu : bande de roulement crantée. */}
      <g
        className="scene-spin"
        style={{ animationDuration: active ? "14s" : "46s" }}
      >
        <circle
          cx="100"
          cy="100"
          r="68"
          fill="none"
          stroke="#0c0e16"
          strokeWidth="20"
        />
        {tread.map((angle, i) => {
          const p = polar(68, angle);
          return (
            <rect
              key={angle}
              x={p.x - 2.1}
              y={p.y - 8}
              width="4.2"
              height="16"
              rx="1"
              fill={i % 2 === 0 ? "#1b2030" : "#12161f"}
              transform={`rotate(${angle} ${p.x} ${p.y})`}
            />
          );
        })}
        {/* Le reflet rasant, qui donne le volume au caoutchouc. */}
        <circle
          cx="100"
          cy="100"
          r="68"
          fill="none"
          stroke={`url(#${uid}-sheen)`}
          strokeWidth="20"
        />
      </g>

      {/* La jante, en sens inverse : c'est ce contresens qui fait mécanique. */}
      <g
        className="scene-spin-reverse"
        style={{ animationDuration: active ? "20s" : "70s" }}
      >
        <circle
          cx="100"
          cy="100"
          r="52"
          fill="none"
          stroke={accent}
          strokeOpacity="0.55"
          strokeWidth="1.6"
        />
        {spokes.map((angle) => {
          const outer = polar(50, angle);
          const inner = polar(20, angle);
          return (
            <line
              key={angle}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              stroke={accent}
              strokeOpacity="0.3"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* Le moyeu et ses cinq boulons — immobiles : c'est l'axe. */}
      <circle cx="100" cy="100" r="19" fill="#0a0d15" />
      <circle
        cx="100"
        cy="100"
        r="19"
        fill="none"
        stroke={accent}
        strokeOpacity="0.7"
        strokeWidth="1.2"
      />
      {bolts.map((angle) => {
        const p = polar(11, angle);
        return (
          <circle key={angle} cx={p.x} cy={p.y} r="2.2" fill={accent} fillOpacity="0.9" />
        );
      })}
      <circle cx="100" cy="100" r="3.4" fill={accent} />
    </>
  );
}

/* ==========================================================================
   CONSTELLATION — E-MULTISERVICE77
   Un noyau, trois univers en orbite, huit noeuds de service. Rien ne tourne
   à la même vitesse : c'est un réseau, pas un engrenage.
   ========================================================================== */
function Constellation({ accent, active, dense }: SceneProps) {
  /** Les trois univers du site : Mobilité, Administratif, Numérique. */
  const rings = [
    { r: 44, count: 3, speed: active ? 18 : 52, reverse: false, tint: accent },
    { r: 68, count: 3, speed: active ? 26 : 74, reverse: true, tint: "#ffc107" },
    { r: 90, count: dense ? 4 : 2, speed: active ? 36 : 96, reverse: false, tint: accent },
  ];

  return (
    <>
      {/* Les orbites, tracées avant les noeuds pour passer dessous. */}
      {rings.map((ring) => (
        <circle
          key={`o${ring.r}`}
          cx="100"
          cy="100"
          r={ring.r}
          fill="none"
          stroke={ring.tint}
          strokeOpacity="0.16"
          strokeWidth="0.7"
          strokeDasharray={ring.r === 90 ? "3 6" : undefined}
        />
      ))}

      {rings.map((ring, ringIndex) => (
        <g
          key={ring.r}
          className={ring.reverse ? "scene-spin-reverse" : "scene-spin"}
          style={{ animationDuration: `${ring.speed}s` }}
        >
          {spread(ring.count, ringIndex * 24).map((angle, i) => {
            const p = polar(ring.r, angle);
            return (
              <g key={angle}>
                {/* Le lien au noyau : c'est ce qui fait un réseau. */}
                <line
                  x1="100"
                  y1="100"
                  x2={p.x}
                  y2={p.y}
                  stroke={ring.tint}
                  strokeOpacity={active ? 0.28 : 0.14}
                  strokeWidth="0.6"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="3.4"
                  fill={ring.tint}
                  className="scene-pulse"
                  style={{
                    animationDuration: `${3.2 + ringIndex * 0.9}s`,
                    animationDelay: `${i * 0.45 + ringIndex * 0.3}s`,
                  }}
                />
              </g>
            );
          })}
        </g>
      ))}

      {/* Le noyau : un hexagone, pas une bille — une interface, pas un astre. */}
      <g className="scene-spin" style={{ animationDuration: active ? "30s" : "80s" }}>
        <polygon
          points={spread(6)
            .map((a) => {
              const p = polar(21, a);
              return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
            })
            .join(" ")}
          fill="#0a0d15"
          stroke={accent}
          strokeOpacity="0.75"
          strokeWidth="1.4"
        />
      </g>
      <circle cx="100" cy="100" r="11" fill={accent} fillOpacity="0.16" />
      <circle
        cx="100"
        cy="100"
        r="4.5"
        fill={accent}
        className="scene-pulse"
        style={{ animationDuration: "3.4s" }}
      />
    </>
  );
}

/* ==========================================================================
   SHADOW — Paristanbul Supermarché
   Une armature, et rien dedans. La mission est engagée, la construction n'a
   pas commencé : le dessin le dit avant le texte.
   ========================================================================== */
function Shadow({ accent, active, dense, uid }: SceneProps) {
  const frame = spread(dense ? 8 : 6);

  return (
    <>
      {/* Orbite d'attente. */}
      <circle
        cx="100"
        cy="100"
        r="92"
        fill="none"
        stroke={accent}
        strokeOpacity="0.2"
        strokeWidth="0.7"
        strokeDasharray="2 9"
      />

      {/* L'armature : un volume esquissé, jamais rempli. */}
      <g
        className="scene-spin"
        style={{ animationDuration: active ? "44s" : "120s" }}
      >
        {/* L'armature reste discrète, jamais effacée : « rien n'est encore
            construit » doit se lire, pas se deviner. */}
        <polygon
          points={frame
            .map((a) => {
              const p = polar(56, a);
              return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
            })
            .join(" ")}
          fill="none"
          stroke={accent}
          strokeOpacity="0.5"
          strokeWidth="1.1"
        />
        {/* Les montants qui relient l'enveloppe au centre vide. */}
        {frame.map((angle) => {
          const outer = polar(56, angle);
          const inner = polar(22, angle);
          return (
            <line
              key={angle}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              stroke={accent}
              strokeOpacity="0.15"
              strokeWidth="0.7"
              strokeDasharray="3 4"
            />
          );
        })}
        <polygon
          points={frame
            .map((a) => {
              const p = polar(22, a + 22);
              return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
            })
            .join(" ")}
          fill="none"
          stroke={accent}
          strokeOpacity="0.42"
          strokeWidth="0.9"
        />
      </g>

      {/* Les repères d'implantation : quatre coins, rien entre eux. */}
      {spread(4, 45).map((angle) => {
        const p = polar(76, angle);
        return (
          <g key={angle} stroke={accent} strokeOpacity="0.4" strokeWidth="0.9">
            <line x1={p.x - 4} y1={p.y} x2={p.x + 4} y2={p.y} />
            <line x1={p.x} y1={p.y - 4} x2={p.x} y2={p.y + 4} />
          </g>
        );
      })}

      {/* La seule lueur : un balayage lent, qui ne révèle rien. */}
      <g
        className="scene-spin"
        style={{ animationDuration: active ? "9s" : "22s" }}
      >
        <path
          d="M100 100 L100 12 A88 88 0 0 1 156 32 Z"
          fill={`url(#${uid}-beam)`}
          className="scene-sweep"
          style={{ animationDuration: active ? "5s" : "11s" }}
        />
      </g>
    </>
  );
}

/* ==========================================================================
   INDUSTRIAL — GG Artisan
   Le seul décor construit autour d'un visuel réel : la couronne graduée
   d'un atelier, posée autour du site en ligne.
   ========================================================================== */
function Industrial({ accent, active, dense }: SceneProps) {
  const ticks = spread(dense ? 48 : 28);

  return (
    <>
      {/* Couronne graduée — l'instrument de mesure de l'artisan. */}
      <g
        className="scene-spin"
        style={{ animationDuration: active ? "40s" : "110s" }}
      >
        <circle
          cx="100"
          cy="100"
          r="94"
          fill="none"
          stroke={accent}
          strokeOpacity="0.22"
          strokeWidth="0.7"
        />
        {ticks.map((angle, i) => {
          const long = i % 4 === 0;
          const a = polar(94, angle);
          const b = polar(long ? 86 : 90, angle);
          return (
            <line
              key={angle}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={accent}
              strokeOpacity={long ? 0.6 : 0.28}
              strokeWidth={long ? 1.2 : 0.7}
            />
          );
        })}
      </g>

      {/* Trois satellites : la mission tourne encore, elle est vivante. */}
      <g
        className="scene-spin-reverse"
        style={{ animationDuration: active ? "26s" : "68s" }}
      >
        {spread(3, 20).map((angle) => {
          const p = polar(94, angle);
          return (
            <circle
              key={angle}
              cx={p.x}
              cy={p.y}
              r="2.8"
              fill={accent}
              className="scene-pulse"
              style={{ animationDuration: "4s" }}
            />
          );
        })}
      </g>
    </>
  );
}

const SCENES: Record<SceneKey, (props: SceneProps) => React.ReactNode> = {
  industrial: Industrial,
  mechanical: Mechanical,
  constellation: Constellation,
  shadow: Shadow,
};

export function MissionScene({
  project,
  active = false,
  priority = false,
  className,
}: {
  project: Project;
  /** Survol du curseur, ou carte amenée au centre au doigt. */
  active?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  /*
    La densité est INTERROGÉE, pas déduite après coup.

    La requête est écrite dans le sens du décor riche — « grand écran ET
    vrai survol ». Le rendu serveur d'une media query vaut `false` : le
    décor part donc léger, et ne se densifie que sur les appareils qui le
    méritent. Écrire la requête dans l'autre sens inverserait le défaut et
    ferait dessiner la version lourde sur chaque téléphone avant de la
    retirer — exactement ce qu'il faut éviter.
  */
  const dense = useMediaQuery("(min-width: 768px) and (hover: hover)");

  /* `visible` met les rotations en pause dès que la scène quitte le champ. */
  useEffect(() => {
    const el = root.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "160px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Scene = SCENES[project.scene];
  const { accent, hue } = project;
  /* Les identifiants de dégradé sont globaux au document : ils portent donc
     l'identifiant du projet, jamais le nom du décor. */
  const uid = `ms-${project.id}`;

  return (
    <div
      ref={root}
      data-live={visible ? "true" : "false"}
      className={cn("relative", className)}
    >
      {/*
        Le puits d'ombre. La page a son propre décor 3D qui défile derrière
        la rangée — une planète cerclée d'anneaux passe précisément ici. Sans
        ce fond, elle traverse les scènes : la constellation se brouille et
        la mission encore dans l'ombre disparaît complètement, alors qu'elle
        doit rester lisible. Le disque sombre creuse donc le vide autour de
        chaque objet, sans jamais montrer d'arête : le dégradé s'éteint bien
        avant le bord de la vignette.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[6%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(4,5,10,0.94) 0%, rgba(4,5,10,0.88) 46%, rgba(4,5,10,0.55) 68%, transparent 82%)",
        }}
      />

      {/* Halo d'ambiance : ce qui détache la scène du vide. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[10%] rounded-full blur-3xl transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at 40% 34%, ${accent}${
            project.phase === "upcoming" ? "1f" : "3d"
          }, transparent 66%)`,
          opacity: active ? 1 : 0.62,
        }}
      />

      {/* Le visuel réel, quand il existe : la planète reste sous le décor. */}
      {project.image && (
        <div className="absolute inset-[13%]">
          <ProjectPlanet
            project={project}
            priority={priority}
            className="h-full w-full"
          />
        </div>
      )}

      <svg
        viewBox="0 0 200 200"
        className="relative h-full w-full overflow-visible"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.07" />
          </linearGradient>
          {/* Le faisceau s'éteint vers son sommet ET vers sa base : une
              lueur qui passe, pas un secteur plein. */}
          <linearGradient id={`${uid}-beam`} x1="0.5" y1="1" x2="0.5" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0" />
            <stop offset="55%" stopColor={accent} stopOpacity="0.1" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`${uid}-core`}>
            <stop offset="0%" stopColor={`hsl(${hue} 70% 60%)`} stopOpacity="0.17" />
            <stop offset="60%" stopColor={`hsl(${hue} 70% 60%)`} stopOpacity="0.05" />
            <stop offset="100%" stopColor={`hsl(${hue} 70% 60%)`} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Fond commun : une lueur centrale, sous tous les décors. Elle
            reste en retrait du bord — c'est une braise derrière l'objet,
            pas un aplat qui le repeindrait. */}
        {!project.image && (
          <circle cx="100" cy="100" r="74" fill={`url(#${uid}-core)`} />
        )}

        <Scene
          accent={accent}
          hue={hue}
          active={active}
          dense={dense}
          uid={uid}
        />
      </svg>
    </div>
  );
}
