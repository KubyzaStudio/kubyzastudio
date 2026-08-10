import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Export statique : le site est 100 % pré-rendu et servi par le CDN Cloudflare.
 * La seule partie dynamique (formulaire) passe par une Cloudflare Pages Function
 * située dans `functions/api/contact.ts`.
 */
const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  // Empêche Turbopack de remonter jusqu'au dossier utilisateur pour trouver la racine.
  turbopack: { root: projectRoot },
  poweredByHeader: false,
  trailingSlash: true,
  images: {
    // Obligatoire en export statique : pas de serveur d'optimisation d'images.
    unoptimized: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
};

export default nextConfig;
