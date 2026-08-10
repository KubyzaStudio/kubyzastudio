/**
 * LES MISSIONS
 * ==========================================================================
 * Une seule règle tient ce fichier : rien n'y est présenté comme fait tant
 * que ce n'est pas fait. Chaque mission porte donc une PHASE, et cette phase
 * commande tout — le vocabulaire de la fiche, l'appel à l'action, et jusqu'au
 * décor qui la représente.
 *
 * Aucun résultat commercial n'est annoncé ici — ni chiffre de fréquentation,
 * ni pourcentage, ni témoignage. Ce qui est décrit est vérifiable : ce que
 * le site contient, ce qui est construit, ce qui reste à faire. Les données
 * proviennent des projets eux-mêmes, jamais d'une supposition.
 */

/**
 * Où en est la mission.
 * `live`     — le site est publié et consultable.
 * `building` — le site est réellement construit, pas encore publié.
 * `upcoming` — la mission est engagée, rien n'est encore construit.
 */
export type ProjectPhase = "live" | "building" | "upcoming";

/**
 * Le décor qui représente la mission.
 * Une mission publiée montre son site ; les autres montrent leur MISSION —
 * jamais un faux aperçu. Chaque clé désigne une identité visuelle distincte,
 * dessinée dans `MissionScene`.
 */
export type SceneKey = "industrial" | "mechanical" | "constellation" | "shadow";

export type Project = {
  id: string;
  /** Numéro d'ordre de mission, affiché tel quel. */
  mission: string;
  name: string;
  category: string;
  /** Secteur en deux mots, pour la vignette. */
  sector: string;
  phase: ProjectPhase;
  scene: SceneKey;
  /** Phrase courte affichée sur la carte. */
  teaser: string;
  description: string;
  /**
   * Ce que contient la mission — factuel, vérifiable.
   * L'intitulé du bloc dépend de la phase (voir `PHASES`).
   */
  scope: string[];
  technologies: string[];
  year: string;
  /**
   * Lien public. `null` tant que le site n'est pas en ligne — et dans ce cas
   * aucun bouton de visite n'est rendu nulle part. Il n'existe pas de chemin
   * de code qui fabrique un lien à partir d'autre chose.
   */
  href: string | null;
  /** Visuel réel du site publié, dans /public/projets. */
  image?: string;
  /** Même visuel, cadré large, pour le bloc principal. */
  wideImage?: string;
  /** Teinte de la mission, en degrés HSL. */
  hue: number;
  /** Couleur d'enseigne réelle du client, pour les accents du décor. */
  accent: string;
};

/**
 * LE VOCABULAIRE DES PHASES
 * Un seul endroit décide de la façon dont une phase se dit et se dessine.
 * `light` est la fraction éclairée du disque de phase (pleine, moitié,
 * nouvelle lune) — voir `MissionPhase`.
 */
export const PHASES: Record<
  ProjectPhase,
  {
    /** Code court, en tête de fiche. */
    code: string;
    /** Ce que la mission est, en une formule. */
    statement: string;
    label: string;
    short: string;
    scopeLabel: string;
    /** Texte de l'action, quand il n'y a pas de site à visiter. */
    standby: string;
    light: number;
  }
> = {
  live: {
    code: "LIVE",
    statement: "Mission accomplie",
    label: "En ligne",
    short: "En ligne",
    scopeLabel: "Ce que le site contient",
    standby: "",
    light: 1,
  },
  building: {
    code: "IN PROGRESS",
    statement: "Mission en cours",
    label: "Mission en cours",
    short: "En cours",
    scopeLabel: "Ce qui est construit",
    standby: "Projet en préparation",
    light: 0.5,
  },
  upcoming: {
    code: "UPCOMING",
    statement: "Prochaine mission",
    label: "Prochaine mission",
    short: "À venir",
    scopeLabel: "Ce qui est prévu",
    standby: "Prochaine mission",
    light: 0,
  },
};

export const projects: Project[] = [
  {
    id: "gg-artisan",
    mission: "001",
    name: "GG Artisan",
    category: "Artisan · Plomberie, chauffage, pompe à chaleur",
    sector: "Plomberie · Chauffage",
    phase: "live",
    scene: "industrial",
    teaser: "Le premier monde mis en orbite.",
    description:
      "Douze prestations réparties en fiches lisibles, une galerie de chantiers avant / après, et une zone d'intervention qui couvre six départements. Le visiteur trouve le métier, l'exemple et le contact sans jamais quitter la page.",
    scope: [
      "Douze prestations, de la plomberie à la pompe à chaleur",
      "Galerie de réalisations avant / après",
      "Zone d'intervention : 77, 91, 89, 10, 45 et 94",
      "Section atelier, avis clients et questions fréquentes",
      "Contact direct, devis et liens vers les réseaux",
    ],
    technologies: ["Site vitrine", "Galerie de chantiers", "Référencement local"],
    year: "2026",
    href: "https://ggartisan.fr/",
    image: "/projets/ggartisan.webp",
    wideImage: "/projets/ggartisan-wide.webp",
    hue: 38,
    accent: "#d8a13a",
  },
  {
    id: "keyspneu77",
    mission: "002",
    name: "KEYSPNEU77",
    category: "Garage · Pneumatiques",
    sector: "Garage · Pneumatiques",
    phase: "building",
    scene: "mechanical",
    teaser: "Construit. En attente de mise en orbite.",
    description:
      "Un site cinématique pour un spécialiste du pneumatique à Montereau-Fault-Yonne. Le noir et l'orange de l'enseigne deviennent la direction artistique : prestations, marques, atelier et appel direct depuis le téléphone. Le site est terminé, il attend sa publication.",
    scope: [
      "Page unique cinématique, défilement fluide",
      "Sept prestations : montage, équilibrage, géométrie, réparation",
      "Marques de pneumatiques et galerie de l'atelier",
      "Appel et itinéraire en un geste depuis le mobile",
      "Reste à faire : nom de domaine et mise en ligne",
    ],
    technologies: ["Next.js", "GSAP", "Animation au défilement"],
    year: "2026",
    href: null,
    hue: 32,
    accent: "#ff9d1a",
  },
  {
    id: "e-multiservice77",
    mission: "003",
    name: "E-MULTISERVICE77",
    category: "Services · Assistance automobile et administrative",
    sector: "Multiservices · 77",
    phase: "building",
    scene: "constellation",
    teaser: "Une interface, plutôt qu'une vitrine.",
    description:
      "Assistance automobile, administrative et numérique en Seine-et-Marne. Le site est construit comme une interface de jeu — jaquette en couverture, sélecteur de missions, écran de briefing — avec un horizon dessiné d'après la silhouette réelle du 77. Terminé, pas encore publié.",
    scope: [
      "Huit services, de la carte grise à l'assistance administrative",
      "Trois univers : Mobilité, Administratif, Numérique",
      "Formulaires de contact et de devis avec anti-spam",
      "Décors vectoriels générés en code, sans banque d'images",
      "Reste à faire : nom de domaine et mise en ligne",
    ],
    technologies: ["Next.js", "Formulaires", "Décors générés en code"],
    year: "2026",
    href: null,
    hue: 320,
    accent: "#ff2d78",
  },
  {
    id: "paristanbul-supermarche",
    mission: "004",
    name: "Paristanbul Supermarché",
    category: "Commerce · Supermarché",
    sector: "Commerce · Alimentaire",
    phase: "upcoming",
    scene: "shadow",
    teaser: "Le monde suivant. Rien n'est encore dessiné.",
    description:
      "La prochaine mission du studio. Le projet est engagé, la construction n'a pas commencé : ni maquette, ni page, ni visuel. Cette planète restera à l'état d'ébauche tant qu'il n'y aura rien de réel à montrer.",
    scope: [
      "Cadrage du besoin et des contenus à réunir",
      "Direction artistique à définir avec le commerce",
      "Aucune maquette ni visuel à ce stade",
    ],
    technologies: ["Mission ouverte"],
    year: "2026",
    href: null,
    hue: 226,
    accent: "#6e97ff",
  },
];

/** La mission publiée ouvre le récit ; les autres le prolongent. */
export const featuredProject = projects[0];
export const upcomingProjects = projects.slice(1);
