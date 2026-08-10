import { ImageResponse } from "next/og";
import { site } from "@/data/site";

/** Requis par l'export statique : l'image est produite au build. */
export const dynamic = "force-static";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${site.name} — ${site.tagline}`;

/**
 * Vignette de partage, générée une seule fois au build.
 * Même univers que le site : noir cosmique, halo bleu, typographie serrée.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "radial-gradient(1000px 560px at 22% -10%, #16215180 0%, #04050a 62%), #04050a",
          position: "relative",
        }}
      >
        {/* Halo de mise à feu. */}
        <div
          style={{
            position: "absolute",
            bottom: -320,
            left: 120,
            width: 960,
            height: 620,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 50% 0%, rgba(61,107,255,0.55) 0%, rgba(18,26,51,0.35) 45%, rgba(4,5,10,0) 72%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#6e97ff",
            }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#9caac8",
            }}
          >
            Kubyza Studio
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 92,
              lineHeight: 1.02,
              letterSpacing: -3,
              color: "#eaf0ff",
              maxWidth: 900,
            }}
          >
            Nous lançons votre présence en ligne.
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: 30,
              lineHeight: 1.35,
              color: "#9caac8",
              maxWidth: 780,
            }}
          >
            Création de sites web modernes pour les commerces, artisans et
            petites entreprises.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 20,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "#5f6c8a",
          }}
        >
          <div>{`${site.location.city} · ${site.location.regionCode}`}</div>
          <div>kubyza.studio</div>
        </div>
      </div>
    ),
    size,
  );
}
