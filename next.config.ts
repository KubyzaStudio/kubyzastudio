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
  /**
   * TESTER SUR UN VRAI TÉLÉPHONE
   * ------------------------------------------------------------------
   * Next bloque par défaut les requêtes vers les ressources du serveur de
   * développement dès qu'elles viennent d'une autre origine que celle avec
   * laquelle il a démarré — c'est-à-dire `localhost`. Ouvrir
   * `http://192.168.1.x:3000` depuis un téléphone du même Wi-Fi est donc
   * une origine différente : le HTML part, les assets sont refusés, et la
   * page reste indéfiniment bloquée sur un écran vide.
   *
   * Le symptôme ne ressemble pas du tout à sa cause : on cherche du côté
   * du pare-feu, de la box ou de l'isolation Wi-Fi, alors que le réseau
   * fonctionne parfaitement. D'où cette note.
   *
   * Les plages ci-dessous couvrent les réseaux domestiques courants —
   * Freebox et Livebox en `192.168.1.x`, la plupart des autres box en
   * `192.168.0.x`, et `10.0.0.x`. Une adresse attribuée par DHCP change :
   * mieux vaut autoriser le sous-réseau que de corriger un chiffre à
   * chaque fois.
   *
   * L'option ne concerne QUE `next dev`. Elle n'a aucun effet sur le site
   * construit, qui est un export statique sans serveur.
   */
  allowedDevOrigins: ["192.168.1.*", "192.168.0.*", "10.0.0.*"],
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
