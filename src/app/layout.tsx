import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { site } from "@/data/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { SCROLL_ANCHOR_SCRIPT } from "@/lib/scroll-anchor";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/*
  Space Grotesk porte tous les titres du site, et le titre du hero est
  l'élément qui décide du LCP : sa police est donc préchargée, et chaque
  fichier inutile qu'elle traîne retarde le moment où le texte s'affiche
  dans sa vraie fonte.

  Quatre graisses étaient déclarées — 400, 500, 600, 700 — et `next/font`
  télécharge ce qu'on lui demande, qu'on s'en serve ou non. Un relevé de
  toutes les classes du projet donne : 39 emplois de `font-medium` (500) et
  un seul de `font-normal` (400). Les graisses 600 et 700 n'apparaissent
  nulle part, ni dans les composants, ni dans `globals.css` — où les titres
  sont fixés à `font-weight: 500`.

  Deux fichiers woff2 partaient donc à chaque visite sans jamais peindre un
  seul glyphe. `font-synthesis-weight: none` (dans `globals.css`) garantit
  par ailleurs qu'aucun gras synthétique ne viendra les remplacer en
  cachette : si une graisse manquait vraiment, cela se verrait tout de suite.
*/
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Kubyza Studio | Création de sites web modernes",
    template: "%s | Kubyza Studio",
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "création site internet Montereau-Fault-Yonne",
    "création site web Seine-et-Marne",
    "agence web 77",
    "création site professionnel",
    "site internet artisan",
    "site internet commerçant",
    "création landing page",
    "refonte site web",
    "référencement local 77",
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  alternates: { canonical: "/" },
  category: "technology",
  formatDetection: { telephone: true, email: true, address: false },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: site.url,
    siteName: site.name,
    title: "Kubyza Studio | Création de sites web modernes",
    description: site.description,
    // La vignette est fournie par `opengraph-image.tsx` (convention Next.js).
  },
  twitter: {
    card: "summary_large_image",
    title: "Kubyza Studio | Création de sites web modernes",
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#04050a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="grain bg-void text-star antialiased">
        {/*
          Exécuté avant tout code de Next.js et avant l'hydratation : le
          navigateur perd la main sur la restauration de défilement pendant
          l'analyse du document. `beforeInteractive` est la seule stratégie
          qui garantit cet ordre — une balise `<script>` écrite à la main
          dans un composant React serait bien présente dans le HTML, mais
          React avertit à juste titre qu'elle ne s'exécuterait pas lors
          d'un rendu client. Voir `src/lib/scroll-anchor.ts` pour la cause
          détaillée du problème.
        */}
        <Script
          id="kubyza-scroll-anchor"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: SCROLL_ANCHOR_SCRIPT }}
        />
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-accent focus:px-5 focus:py-3 focus:text-sm focus:font-medium focus:text-white"
        >
          Aller au contenu
        </a>
        {children}
        <JsonLd />
      </body>
    </html>
  );
}
