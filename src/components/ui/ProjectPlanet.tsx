import Image from "next/image";
import type { Project } from "@/data/projects";
import { cn } from "@/lib/utils";

/**
 * LE VISUEL D'UN PROJET
 * ==========================================================================
 * Une planète, jamais une vignette.
 *
 * Quand le projet possède un vrai visuel, celui-ci ne remplace pas la
 * planète : il en devient la SURFACE. La même lumière rasante, le même
 * terminateur et le même limbe sont composés par-dessus la photographie,
 * si bien qu'un atelier ou un chantier réel entre dans l'univers au lieu
 * d'y être collé. C'est ce qui permet de montrer du vrai sans quitter le
 * vide spatial.
 *
 * Sans visuel, la planète est générée à partir de la teinte du projet.
 * Aucun faux aperçu de site, aucun placeholder gris n'apparaît jamais.
 *
 * Une mission à venir n'a rien à montrer : sa planète reste une ébauche —
 * un corps sombre cerclé d'une orbite en pointillé. L'honnêteté du contenu
 * se lit donc dans le dessin lui-même.
 */
export function ProjectPlanet({
  project,
  className,
  priority = false,
}: {
  project: Project;
  className?: string;
  priority?: boolean;
}) {
  const { hue, image, phase } = project;
  const unformed = phase === "upcoming";

  return (
    <div className={cn("relative", className)} aria-hidden={image ? undefined : true}>
      {/* Atmosphère — le halo qui détache la planète du vide. */}
      <div
        className={cn(
          "absolute -inset-[12%] rounded-full blur-2xl",
          unformed && "opacity-40",
        )}
        style={{
          background: `radial-gradient(circle at 32% 28%, hsl(${hue} 80% 62% / ${
            unformed ? 0.18 : 0.38
          }), transparent 62%)`,
        }}
      />

      {/* Le corps. `isolate` enferme les fusions de calques : sans lui, le
          terminateur en `multiply` irait assombrir le fond de la page. */}
      <div className="relative isolate h-full w-full overflow-hidden rounded-full">
        {image ? (
          <>
            <Image
              src={image}
              alt={`${project.name} — ${project.category}`}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
              className="object-cover"
              priority={priority}
            />
            {/*
              La surface photographiée reçoit l'éclairage de la planète
              procédurale : teinte du projet du côté jour, nuit du côté
              opposé. Sans cette passe, l'image resterait un médaillon
              découpé au milieu du vide.

              Le centre reste volontairement clair sur une large fraction du
              disque : c'est là que se trouve le sujet du visuel, et un
              terminateur trop précoce éteindrait les couleurs réelles de
              l'enseigne — l'or de GG Artisan virerait au brun. La rondeur
              est donc obtenue par le bord, pas en assombrissant le motif.
            */}
            <div
              className="absolute inset-0 mix-blend-multiply"
              style={{
                background: `radial-gradient(circle at 38% 32%,
                  hsl(${hue} 15% 100%) 0%,
                  hsl(${hue} 20% 96%) 42%,
                  hsl(${hue} 34% 68%) 68%,
                  hsl(${hue} 44% 26%) 87%,
                  #05070f 99%)`,
              }}
            />
            <div
              className="absolute inset-0 mix-blend-overlay"
              style={{
                background: `radial-gradient(circle at 31% 25%, hsl(${hue} 90% 72% / 0.34) 0%, transparent 58%)`,
              }}
            />
          </>
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `
                radial-gradient(circle at 31% 25%,
                  hsl(${hue} 58% ${unformed ? 34 : 64}%) 0%,
                  hsl(${hue} 52% ${unformed ? 22 : 42}%) 22%,
                  hsl(${hue} 48% ${unformed ? 13 : 22}%) 44%,
                  hsl(${hue} 45% ${unformed ? 7 : 10}%) 64%,
                  #05070f 84%),
                radial-gradient(circle at 74% 82%, hsl(${(hue + 16) % 360} 60% 40% / 0.28), transparent 52%)
              `,
            }}
          />
        )}

        {/* Grain de surface : sans lui, la sphère reste une bille lisse.
            Réservé à la face éclairée — le côté nuit reste lisse. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E")`,
            maskImage:
              "radial-gradient(circle at 31% 25%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 40%, transparent 72%)",
          }}
        />

        {/* Ombre volumique : c'est elle qui donne la rondeur. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            boxShadow: `
              inset -16px -20px 46px rgba(2,3,8,0.9),
              inset 8px 10px 30px hsl(${hue} 85% 78% / 0.2)
            `,
          }}
        />
      </div>

      {/* Ombre portée, sous la planète. */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ boxShadow: "0 26px 64px -22px rgba(0,0,0,0.95)" }}
      />

      {/* Limbe lumineux : le liseré qui détache la planète du vide. */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 33% 28%, transparent 60%, hsl(${hue} 95% 78% / ${
            unformed ? 0.16 : 0.3
          }) 78%, transparent 88%)`,
        }}
      />

      {/* L'orbite d'une mission qui n'a pas encore de monde : rien n'est
          construit, et le dessin le dit avant le texte. */}
      {unformed && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[7%] rounded-full border border-dashed border-dim/35"
        />
      )}
    </div>
  );
}
