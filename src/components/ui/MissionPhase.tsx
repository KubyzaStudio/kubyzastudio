import { PHASES, type ProjectPhase } from "@/data/projects";
import { cn } from "@/lib/utils";

/**
 * LA PHASE D'UNE MISSION
 * ==========================================================================
 * Un site en ligne, un site construit, une mission ouverte : trois états
 * qu'il faut distinguer d'un coup d'œil, sans écrire « badge » nulle part.
 *
 * Le signe retenu est une PHASE DE LUNE — le seul cadran que cet univers
 * possédait déjà. Le disque est plein quand le site éclaire (en ligne),
 * à moitié éclairé quand il est construit mais pas publié, réduit à un
 * cercle en pointillé quand rien n'existe encore. La lecture est immédiate
 * et elle ne demande aucune légende : un monde s'allume, ou pas.
 *
 * Le disque plein respire — c'est la seule phase animée, parce que c'est la
 * seule qui soit vivante. Les autres sont immobiles, et c'est le propos.
 */
export function MissionPhase({
  phase,
  className,
  compact = false,
  variant = "label",
}: {
  phase: ProjectPhase;
  className?: string;
  /** Vrai dans la rangée : le libellé court, sans halo. */
  compact?: boolean;
  /**
   * `label` — la phase dite en français (« Mission en cours »).
   * `code`  — le code court du poste de commande (« IN PROGRESS »).
   */
  variant?: "label" | "code";
}) {
  const { light, label, short, code } = PHASES[phase];
  const text = variant === "code" ? code : compact ? short : label;

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
        {/* Le halo n'appartient qu'au monde allumé. */}
        {light === 1 && !compact && (
          <span
            aria-hidden="true"
            className="animate-breathe absolute inset-[-55%] rounded-full bg-accent-glow/25 blur-[6px]"
          />
        )}

        <svg
          viewBox="0 0 12 12"
          className="relative h-3 w-3 overflow-visible"
          aria-hidden="true"
        >
          {/* Le limbe : toujours présent, même quand le monde est éteint. */}
          <circle
            cx="6"
            cy="6"
            r="4.6"
            fill="none"
            strokeWidth="1"
            className={cn(
              light === 0 ? "stroke-dim/70" : "stroke-accent-soft/70",
            )}
            strokeDasharray={light === 0 ? "1.6 2.1" : undefined}
          />

          {light === 1 && (
            <circle
              cx="6"
              cy="6"
              r="4.6"
              className="fill-accent-glow drop-shadow-[0_0_4px_rgba(110,151,255,0.9)]"
            />
          )}

          {/* Moitié éclairée : le terminateur passe au centre du disque. */}
          {light === 0.5 && (
            <path
              d="M6 1.4 A4.6 4.6 0 0 1 6 10.6 Z"
              className="fill-accent-soft/85"
            />
          )}
        </svg>
      </span>

      <span
        className={cn(
          "font-mono text-[0.5625rem] tracking-[0.22em] uppercase",
          light === 1 ? "text-accent-glow" : light === 0.5 ? "text-mist" : "text-dim",
        )}
      >
        {text}
      </span>
    </span>
  );
}
