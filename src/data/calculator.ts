import { plans, type Plan } from "@/data/pricing";

/**
 * LA CONSOLE DE MISSION
 * ==========================================================================
 * Ce n'est pas un calculateur qui additionne des lignes dans le vide : c'est
 * un instrument qui RAMÈNE le visiteur vers l'une des trois missions.
 *
 * Le mécanisme tient en une idée. Les trois premières questions ne coûtent
 * rien — elles pèsent. Leur somme donne un « poids de mission » qui désigne
 * le palier adapté (Exploration, Orbite, Galaxie), et c'est le prix annoncé
 * de ce palier qui sert de plancher. Seuls les modules ajoutent ensuite un
 * supplément.
 *
 * Conséquence : l'estimation ne peut jamais tomber sous le prix affiché dans
 * les offres, ni flotter entre deux paliers. Le visiteur lit une trajectoire
 * — son besoin, sa mission, son montant, son délai — et non un total opaque.
 */

export type CalcOption = {
  id: string;
  label: string;
  hint: string;
  /** Poids de mission : c'est lui qui désigne le palier. */
  weight?: number;
  /** Supplément en euros, ajouté au prix du palier. */
  price?: number;
  /** Jours ouvrés ajoutés au délai du palier. */
  days?: number;
};

export type CalcStep = {
  id: "type" | "objectif" | "design" | "options" | "suivi";
  label: string;
  question: string;
  /** `true` : plusieurs réponses possibles. */
  multiple?: boolean;
  options: CalcOption[];
};

export const calculatorSteps: CalcStep[] = [
  {
    id: "type",
    label: "Type de mission",
    question: "Quel type de projet ?",
    options: [
      {
        id: "page",
        label: "Une page unique",
        hint: "Tout au même endroit",
        weight: 0,
      },
      {
        id: "vitrine",
        label: "Site vitrine",
        hint: "Plusieurs pages, une par sujet",
        weight: 2,
      },
      {
        id: "refonte",
        label: "Refonte",
        hint: "Moderniser l'existant",
        weight: 2,
      },
      {
        id: "surmesure",
        label: "Site sur-mesure",
        hint: "Une expérience à part",
        weight: 4,
      },
    ],
  },
  {
    id: "objectif",
    label: "Objectif",
    question: "Que doit accomplir ce site ?",
    options: [
      {
        id: "trouve",
        label: "Être trouvé",
        hint: "Exister sur Google",
        weight: 0,
      },
      {
        id: "montrer",
        label: "Montrer mon travail",
        hint: "Photos et réalisations",
        weight: 1,
      },
      {
        id: "demandes",
        label: "Recevoir des demandes",
        hint: "Devis et appels entrants",
        weight: 1,
      },
      {
        id: "reserver",
        label: "Faire réserver ou vendre",
        hint: "Un parcours complet",
        weight: 3,
      },
    ],
  },
  {
    id: "design",
    label: "Niveau de design",
    question: "À quel point le design doit-il être unique ?",
    options: [
      {
        id: "clair",
        label: "Épuré",
        hint: "Clair, efficace, rapide",
        weight: 0,
      },
      {
        id: "surmesure",
        label: "Sur-mesure",
        hint: "Une identité à vous",
        weight: 2,
      },
      {
        id: "signature",
        label: "Signature",
        hint: "Animations, 3D, effet mémorable",
        weight: 4,
      },
    ],
  },
  {
    id: "options",
    label: "Modules",
    question: "Besoin de quelque chose en plus ?",
    multiple: true,
    options: [
      {
        id: "seo",
        label: "Référencement local",
        hint: "Apparaître sur Google",
        price: 150,
        days: 1,
      },
      {
        id: "content",
        label: "Textes rédigés",
        hint: "On écrit pour vous",
        price: 130,
        days: 1,
      },
      {
        id: "photo",
        label: "Photos et visuels",
        hint: "Retouche et mise en scène",
        price: 120,
        days: 1,
      },
      {
        id: "booking",
        label: "Prise de rendez-vous",
        hint: "Un agenda en ligne",
        price: 190,
        days: 2,
      },
    ],
  },
  {
    id: "suivi",
    label: "Suivi",
    question: "Souhaitez-vous un suivi après le lancement ?",
    options: [
      {
        id: "none",
        label: "Non merci",
        hint: "Le site vous appartient",
      },
      {
        id: "care",
        label: "Suivi orbital",
        hint: "49 €/mois — modifications incluses",
      },
    ],
  },
];

/** Réponses de départ : la mission la plus fréquente, déjà configurée. */
export const CALCULATOR_DEFAULTS: Record<string, string[]> = {
  type: ["vitrine"],
  objectif: ["demandes"],
  design: ["surmesure"],
  options: [],
  suivi: ["care"],
};

/**
 * Marge haute de l'estimation. Le prix du palier est un plancher annoncé :
 * la fourchette ne descend jamais sous lui, elle ne fait que monter.
 */
export const ESTIMATE_SPREAD = 0.15;

export type MissionEstimate = {
  plan: Plan;
  /** Plancher : prix du palier + suppléments choisis. */
  low: number;
  /** Marge haute, arrondie à la dizaine. */
  high: number;
  days: number;
  /** Ce que le visiteur a répondu, en clair. */
  chosen: string[];
  care: boolean;
};

/** Arrondi commercial : on n'annonce jamais 1 247 €. */
const roundTen = (value: number) => Math.round(value / 10) * 10;

/**
 * Traduit les réponses en mission recommandée puis en estimation.
 * Toute la logique tient ici : les composants ne font que l'afficher.
 */
export function estimateMission(
  answers: Record<string, string[]>,
): MissionEstimate {
  let weight = 0;
  let supplement = 0;
  let extraDays = 0;
  const chosen: string[] = [];

  for (const step of calculatorSteps) {
    for (const option of step.options) {
      if (!answers[step.id]?.includes(option.id)) continue;
      weight += option.weight ?? 0;
      supplement += option.price ?? 0;
      extraDays += option.days ?? 0;
      chosen.push(`${step.label} : ${option.label}`);
    }
  }

  // Le dernier palier dont le seuil est atteint l'emporte.
  const plan =
    [...plans].reverse().find((candidate) => weight >= candidate.threshold) ??
    plans[0];

  const low = plan.from + supplement;

  return {
    plan,
    low,
    high: roundTen(low * (1 + ESTIMATE_SPREAD)),
    days: plan.days + extraDays,
    chosen,
    care: answers.suivi?.includes("care") ?? false,
  };
}
