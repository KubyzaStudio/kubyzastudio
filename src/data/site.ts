/**
 * Source unique de vérité pour l'identité du studio.
 * Modifier ce fichier suffit à mettre à jour le site, le SEO et les emails.
 */

/**
 * LES ADRESSES SOCIALES
 * ==========================================================================
 * Un seul endroit, une seule fois. Chaque compte est surchargeable par
 * variable d'environnement — changer de pseudo ne demande aucun déploiement
 * de code, et aucune URL n'est écrite en dur ailleurs dans le projet.
 *
 * Voir `.env.example` :
 *   NEXT_PUBLIC_SNAPCHAT_URL
 *   NEXT_PUBLIC_TELEGRAM_URL
 *   NEXT_PUBLIC_INSTAGRAM_URL
 */
export const SNAPCHAT_URL =
  process.env.NEXT_PUBLIC_SNAPCHAT_URL ?? "https://snapchat.com/add/kubyza.studio";
/*
  Telegram est le seul canal dont l'identifiant diffère des deux autres
  (Snapchat et Instagram sont tous deux `kubyza.studio`). Il est conservé
  tel quel : changer une adresse de compte réelle sans confirmation
  casserait le lien. À vérifier, puis à aligner ici ou par variable
  d'environnement si le compte est bien `kubyza.studio`.
*/
export const TELEGRAM_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "https://t.me/kubyzastudio";
export const INSTAGRAM_URL =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com/kubyza.studio";

export type Channel = {
  id: string;
  label: string;
  handle: string;
  href: string;
  /** Rendu 3D détouré, 768 px — pour l'objet posé en grand. */
  artifact: string;
  /**
   * Le même rendu en 192 px, pour les vignettes.
   *
   * L'export statique interdit l'optimiseur d'images de Next (`unoptimized`
   * dans `next.config.ts`) : `sizes` ne génère aucun `srcset`, et le
   * navigateur télécharge toujours le fichier tel qu'il est nommé. Un
   * artefact de 768 px était donc servi entier pour peindre un carré de
   * 24 px dans le pied de page — 78 Ko pour l'équivalent d'une puce.
   *
   * Les deux tailles sont donc déclarées ici, explicitement, et chaque
   * emplacement choisit la sienne. Régénérer les vignettes après avoir
   * remplacé un artefact : voir `README.md`.
   */
  artifactSmall: string;
  /** Ce qu'on y trouve — une phrase, jamais plus. */
  note: string;
  /** Ce qu'on y gagne, dit au visiteur. */
  promise: string;
  primary: boolean;
};

/**
 * LES CANAUX
 * ==========================================================================
 * Snapchat mène le trio : c'est là que le chantier se raconte au jour le
 * jour. Telegram est la réponse immédiate, Instagram la vitrine.
 *
 * Cette liste alimente la section « Signal » ET le pied de page : ajouter
 * un canal ici le fait apparaître aux deux endroits, avec le même visuel.
 */
const channels: Channel[] = [
  {
    id: "snapchat",
    label: "Snapchat",
    handle: "kubyza.studio",
    href: SNAPCHAT_URL,
    artifact: "/artefacts/snapchat.webp",
    artifactSmall: "/artefacts/snapchat-sm.webp",
    note: "Les coulisses, en direct.",
    promise: "Le chantier au jour le jour",
    primary: true,
  },
  {
    id: "telegram",
    label: "Telegram",
    handle: "@kubyzastudio",
    href: TELEGRAM_URL,
    artifact: "/artefacts/telegram.webp",
    artifactSmall: "/artefacts/telegram-sm.webp",
    note: "Une réponse, tout de suite.",
    promise: "Une réponse en direct",
    primary: false,
  },
  {
    id: "instagram",
    label: "Instagram",
    handle: "@kubyza.studio",
    href: INSTAGRAM_URL,
    artifact: "/artefacts/instagram.webp",
    artifactSmall: "/artefacts/instagram-sm.webp",
    note: "Les lancements, en images.",
    promise: "Les lancements en images",
    primary: false,
  },
];

export const site = {
  name: "Kubyza Studio",
  tagline: "Nous lançons votre présence en ligne.",
  subline:
    "Des sites web modernes, pensés pour donner une nouvelle dimension à votre activité.",
  description:
    "Kubyza Studio crée des sites web modernes, rapides et sur-mesure pour les commerçants, artisans et petites entreprises. Basé à Montereau-Fault-Yonne, en Seine-et-Marne.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://kubyzastudio.cloud",

  contact: {
    email: "kubyza.studio@gmail.com",
    phone: "+33 7 66 02 68 44",
    // Format international requis pour les liens `tel:` et les données structurées.
    phoneRaw: "+33766026844",
  },

  location: {
    city: "Montereau-Fault-Yonne",
    region: "Seine-et-Marne",
    regionCode: "77",
    country: "France",
    countryCode: "FR",
    postalCode: "77130",
    latitude: 48.3847,
    longitude: 2.9556,
    // Zone d'intervention affichée et déclarée à Google.
    areaServed: [
      "Montereau-Fault-Yonne",
      "Fontainebleau",
      "Melun",
      "Sens",
      "Provins",
      "Seine-et-Marne",
      "Île-de-France",
    ],
  },

  /** Canaux directs — la section « Signal » et le pied de page. */
  channels,

  /**
   * Les réseaux affichés dans le pied de page sont exactement les canaux :
   * aucune liste parallèle à maintenir, aucune URL dupliquée.
   */
  socials: channels,

  /**
   * LE JOURNAL DE BORD
   * Il n'y a pas de « menu » : il y a des étapes du voyage. Le HUD, le
   * rail latéral, le menu plein écran et le pied de page lisent tous
   * cette liste — une étape ajoutée ici apparaît partout.
   */
  journey: [
    { code: "01", label: "Départ", href: "#top", body: "Kubyza Prime" },
    { code: "02", label: "Constat", href: "#constat", body: "Érosion" },
    { code: "03", label: "Missions", href: "#missions", body: "Ceinture" },
    { code: "04", label: "Réalisations", href: "#realisations", body: "Givre" },
    { code: "05", label: "Signal", href: "#signal", body: "Ombre" },
    { code: "06", label: "Offres", href: "#offres", body: "Méridienne" },
    { code: "07", label: "Estimation", href: "#estimation", body: "Orbite basse" },
    { code: "08", label: "Preuves", href: "#preuves", body: "Approche" },
    { code: "09", label: "Avis", href: "#avis", body: "Échos" },
    { code: "10", label: "Contact", href: "#contact", body: "Terminus" },
  ],
} as const;

export type JourneyStep = (typeof site.journey)[number];

export type Site = typeof site;
