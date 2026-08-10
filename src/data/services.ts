export type Service = {
  id: string;
  code: string;
  title: string;
  description: string;
  /** Bénéfice concret, en langage client. */
  outcome: string;
  /** Ce que le client reçoit vraiment. */
  includes: string[];
};

export const services: Service[] = [
  {
    id: "site-web",
    code: "MISSION 01",
    title: "Création de site web",
    description: "Une présence en ligne conçue autour de votre activité.",
    outcome: "Vos clients trouvent tout ce qu'ils cherchent, en dix secondes.",
    includes: [
      "Design sur-mesure",
      "Pages illimitées selon l'offre",
      "Adapté au téléphone",
      "Mise en ligne incluse",
    ],
  },
  {
    id: "landing-page",
    code: "MISSION 02",
    title: "Landing page",
    description:
      "Une page pensée pour présenter une offre et convertir vos visiteurs.",
    outcome: "Une offre, un message, un bouton. Rien pour distraire.",
    includes: [
      "Structure orientée résultat",
      "Formulaire de contact",
      "Chargement instantané",
      "Prête pour vos publicités",
    ],
  },
  {
    id: "refonte",
    code: "MISSION 03",
    title: "Refonte",
    description: "Moderniser une présence existante.",
    outcome: "Votre site rattrape enfin le niveau de votre travail.",
    includes: [
      "Audit de l'existant",
      "Nouveau design",
      "Contenus repris et réécrits",
      "Redirections préservées",
    ],
  },
  {
    id: "referencement",
    code: "MISSION 04",
    title: "Référencement naturel",
    description: "Améliorer votre visibilité sur les moteurs de recherche.",
    outcome: "On vous trouve quand on cherche votre métier près de chez vous.",
    includes: [
      "Recherche locale",
      "Optimisation des pages",
      "Fiche Google Business",
      "Suivi des positions",
    ],
  },
  {
    id: "maintenance",
    code: "MISSION 05",
    title: "Maintenance",
    description: "Votre site reste à jour et évolue avec vous.",
    outcome: "Vous ne touchez à rien. On s'occupe de tout.",
    includes: [
      "Mises à jour techniques",
      "Sauvegardes",
      "Modifications de contenu",
      "Support par message",
    ],
  },
  {
    id: "automatisation",
    code: "MISSION 06",
    title: "Automatisation",
    description: "Des outils pour simplifier votre quotidien.",
    outcome: "Les demandes arrivent triées, les rappels partent tout seuls.",
    includes: [
      "Prise de rendez-vous",
      "Devis automatiques",
      "Réponses par email",
      "Connexion à vos outils",
    ],
  },
];
