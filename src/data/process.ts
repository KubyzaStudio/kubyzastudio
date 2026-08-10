export type ProcessStep = {
  code: string;
  title: string;
  description: string;
  /** Ce que le client a à faire, exprimé sans jargon. */
  yourPart: string;
  duration: string;
};

/*
  Le déroulé est le même quelle que soit la mission : seule sa durée change.
  Les étapes sont donc datées en relatif — écrire « Jour 11 » contredirait
  une Exploration livrée en deux jours.
*/
export const processSteps: ProcessStep[] = [
  {
    code: "01",
    title: "Analyse de mission",
    description: "Comprendre votre activité et vos objectifs.",
    yourPart: "Vous nous parlez de votre métier. C'est tout.",
    duration: "Premier jour",
  },
  {
    code: "02",
    title: "Conception",
    description: "Création du design et de l'expérience.",
    yourPart: "Vous validez une maquette. On ajuste jusqu'au oui.",
    duration: "Dès l'accord",
  },
  {
    code: "03",
    title: "Construction",
    description: "Développement du site.",
    yourPart: "Vous n'avez rien à faire. On construit.",
    duration: "Cœur de mission",
  },
  {
    code: "04",
    title: "Tests",
    description: "Optimisation mobile et performances.",
    yourPart: "Vous testez depuis votre téléphone.",
    duration: "Avant-dernier jour",
  },
  {
    code: "05",
    title: "Décollage",
    description: "Mise en ligne.",
    yourPart: "Vous partagez votre lien partout.",
    duration: "Jour de lancement",
  },
  {
    code: "06",
    title: "Suivi",
    description: "Améliorations et maintenance.",
    yourPart: "Vous demandez, on modifie.",
    duration: "En continu",
  },
];
