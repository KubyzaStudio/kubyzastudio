import { plans } from "@/data/pricing";

/**
 * LES ENGAGEMENTS
 * ==========================================================================
 * Cette bande occupait la place de quatre témoignages inventés. Un studio
 * qui vient de mettre son premier site en ligne n'a pas encore de mur
 * d'avis — et fabriquer les siens aurait coûté plus cher que de ne rien
 * afficher : c'est exactement ce qu'un visiteur méfiant cherche à vérifier.
 *
 * À la place, quatre engagements. Ils ne se réclament d'aucun client, ils
 * n'annoncent aucun résultat, et chacun est opposable : ce sont des
 * promesses qu'on peut nous rappeler, pas des preuves qu'on aurait mises
 * en scène.
 */
export type Commitment = {
  id: string;
  code: string;
  title: string;
  body: string;
};

const [exploration, orbite, galaxie] = plans;

export const commitments: Commitment[] = [
  {
    id: "prix",
    code: "ENGAGEMENT 01",
    title: "Le montant est fixé avant de commencer",
    body: "Vous connaissez le prix au moment de dire oui. Il ne bouge plus ensuite, et rien ne s'ajoute en cours de route sans votre accord écrit.",
  },
  {
    id: "delai",
    code: "ENGAGEMENT 02",
    title: `${exploration.days}, ${orbite.days} ou ${galaxie.days} jours, selon la mission`,
    body: "Le délai est annoncé avec le devis. Il démarre le jour où nous avons vos informations et vos photos, pas avant.",
  },
  {
    id: "reponse",
    code: "ENGAGEMENT 03",
    title: "Une réponse sous 24 heures",
    body: "Une demande envoyée aujourd'hui reçoit une réponse demain au plus tard. Pendant la mission, vous avez un canal direct, sans ticket ni standard.",
  },
  {
    id: "propriete",
    code: "ENGAGEMENT 04",
    title: "Le site vous appartient",
    body: "Nom de domaine, contenus, accès : tout est à votre nom dès le premier jour. Si vous partez, vous partez avec votre site.",
  },
];
