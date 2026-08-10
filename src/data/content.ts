/** Section 4 — la prise de conscience. */
export type Problem = {
  code: string;
  signal: string;
  title: string;
  description: string;
};

export const problems: Problem[] = [
  {
    code: "01",
    signal: "Signal perdu",
    title: "On ne vous trouve pas",
    description:
      "Un client cherche votre métier près de chez lui. Il tombe sur vos concurrents. Vous n'apparaissez nulle part.",
  },
  {
    code: "02",
    signal: "Données dispersées",
    title: "Vos réalisations disparaissent",
    description:
      "Vos plus belles photos sont enterrées sous trois mois de publications. Personne ne remonte aussi loin.",
  },
  {
    code: "03",
    signal: "Image brouillée",
    title: "Votre image ne vous ressemble pas",
    description:
      "Vous faites un travail soigné. Ce qu'on voit de vous en ligne raconte autre chose.",
  },
  {
    code: "04",
    signal: "Trajectoire manquée",
    title: "Vous perdez des occasions",
    description:
      "Des gens voulaient vous appeler. Ils n'ont pas trouvé le numéro, les horaires, ou la confiance nécessaire.",
  },
];

/** Section 5 — la solution, en bénéfices. */
export type Benefit = {
  code: string;
  title: string;
  description: string;
};

export const benefits: Benefit[] = [
  {
    code: "01",
    title: "Une image professionnelle",
    description:
      "Un site qui représente votre activité aussi bien que votre travail la représente.",
  },
  {
    code: "02",
    title: "Accessible partout",
    description:
      "Un lien simple à partager. Sur une carte de visite, un devis, un message ou une vitrine.",
  },
  {
    code: "03",
    title: "Disponible 24 h/24",
    description:
      "Votre activité reste visible même quand vous êtes occupé, fermé, ou en train de travailler.",
  },
  {
    code: "04",
    title: "Évolutif",
    description:
      "Votre site grandit avec votre entreprise. Une page, un service, une offre : on ajoute quand vous voulez.",
  },
];

/** Section 11 — réseaux sociaux vs site professionnel. */
export type ComparisonRow = {
  criterion: string;
  social: string;
  website: string;
};

export const comparison: ComparisonRow[] = [
  {
    criterion: "À qui appartient l'espace",
    social: "À la plateforme. Elle décide des règles.",
    website: "À vous. Personne ne peut le fermer.",
  },
  {
    criterion: "Retrouver une information",
    social: "Il faut remonter le fil, parfois des mois.",
    website: "Tout est classé, visible en un coup d'œil.",
  },
  {
    criterion: "Être trouvé sur Google",
    social: "Presque impossible pour une recherche locale.",
    website: "Conçu pour apparaître dans les résultats.",
  },
  {
    criterion: "Ce que ça inspire",
    social: "Une activité en cours, parfois amateur.",
    website: "Une entreprise installée, sérieuse.",
  },
  {
    criterion: "Le jour où la plateforme change",
    social: "Votre visibilité chute, sans prévenir.",
    website: "Rien ne bouge. Vous êtes chez vous.",
  },
];

/** Section 9 — avant / après. */
export const beforeAfter = {
  before: {
    label: "Avant le lancement",
    title: "Une activité qui existe",
    points: [
      "Une page de réseau social mise à jour quand il y a le temps",
      "Des horaires demandés dix fois par jour au téléphone",
      "Des photos superbes, invisibles",
      "Un client qui hésite, puis appelle ailleurs",
    ],
  },
  after: {
    label: "Après le lancement",
    title: "Une activité qu'on trouve",
    points: [
      "Une adresse à vous, que vous partagez partout",
      "Horaires, tarifs et contact visibles en trois secondes",
      "Vos réalisations mises en scène, en grand",
      "Un client rassuré, qui prend rendez-vous",
    ],
  },
} as const;
