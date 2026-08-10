export type Plan = {
  id: string;
  code: string;
  name: string;
  pitch: string;
  /** Prix de départ, en euros. */
  from: number;
  /** Délai de livraison, en jours ouvrés. Source unique : `delay` en découle. */
  days: number;
  /**
   * Le poids de mission à partir duquel la console recommande ce palier.
   * Les trois seuils se lisent dans l'ordre : c'est le dernier palier
   * atteint qui l'emporte.
   */
  threshold: number;
  features: string[];
  featured?: boolean;
  cta: string;
};

/**
 * LES TROIS PALIERS
 * ==========================================================================
 * Trois montants, trois délais, et rien entre les deux. Ce que chaque
 * palier contient a été calibré sur le temps réellement disponible : deux
 * jours ne permettent pas de rédiger des contenus, quatorze permettent une
 * expérience animée. Une offre qu'on ne peut pas tenir n'est pas une offre.
 */
export const plans: Plan[] = [
  {
    id: "exploration",
    code: "NIVEAU 01",
    name: "Mission Exploration",
    pitch: "Le point de départ.",
    from: 199,
    days: 2,
    threshold: 0,
    features: [
      "Une page unique et complète",
      "Vos services, vos horaires, votre zone",
      "Adaptation mobile soignée",
      "Bouton d'appel et formulaire de contact",
      "Mise en ligne incluse",
    ],
    cta: "Poser la première pierre",
  },
  {
    id: "orbite",
    code: "NIVEAU 02",
    name: "Mission Orbite",
    pitch:
      "Le choix naturel pour une entreprise qui veut une vraie présence en ligne.",
    from: 699,
    days: 7,
    threshold: 3,
    features: [
      "Site complet, jusqu'à 6 pages",
      "Design entièrement personnalisé",
      "Galerie de réalisations",
      "Référencement local et fiche Google Business",
      "Formulaire de devis relié à votre boîte mail",
      "Prise en main expliquée en direct",
    ],
    featured: true,
    cta: "Lancer ma mission",
  },
  {
    id: "galaxie",
    code: "NIVEAU 03",
    name: "Mission Galaxie",
    pitch: "Pour une expérience web plus ambitieuse.",
    from: 1399,
    days: 14,
    threshold: 7,
    features: [
      "Site sur-mesure, sans limite de pages",
      "Direction artistique dédiée à votre marque",
      "Animations au défilement, 3D si le sujet le porte",
      "Textes retravaillés et visuels mis en scène",
      "Référencement approfondi, page par page",
      "Accompagnement pendant les trois premiers mois",
    ],
    cta: "Voir grand",
  },
];

/** Le délai affiché découle du nombre de jours : une seule valeur à tenir. */
export const planDelay = (plan: Plan) => `${plan.days} jours`;

export const planById = (id: string) => plans.find((plan) => plan.id === id);

export type MaintenanceTier = {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
};

export const maintenance: MaintenanceTier = {
  id: "suivi-orbital",
  name: "Suivi orbital",
  price: 49,
  description:
    "Votre site continue d'évoluer après son lancement. Vous demandez, on s'occupe du reste.",
  features: [
    "Hébergement et nom de domaine gérés",
    "Modifications de contenu chaque mois",
    "Sauvegardes et mises à jour",
    "Surveillance des performances",
    "Support par message, réponse sous 24 h",
  ],
};
