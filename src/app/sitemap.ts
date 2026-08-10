import type { MetadataRoute } from "next";
import { site } from "@/data/site";

/** Requis par l'export statique : le fichier est figé au build. */
export const dynamic = "force-static";

/** Site d'une seule page : le plan reste court, mais il doit exister. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${site.url}/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
