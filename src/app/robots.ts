import type { MetadataRoute } from "next";
import { site } from "@/data/site";

/** Requis par l'export statique : le fichier est figé au build. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
