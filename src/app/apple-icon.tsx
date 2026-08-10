import { ImageResponse } from "next/og";

/** Requis par l'export statique : l'image est produite au build. */
export const dynamic = "force-static";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Icône iOS — générée au build, aucun binaire à versionner. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(120px 120px at 35% 25%, #162151 0%, #04050a 70%), #04050a",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 999,
            border: "5px solid #a9c8ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "#a9c8ff",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
