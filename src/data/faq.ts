import { plans } from "@/data/pricing";
import { formatEuro } from "@/lib/utils";

export type FaqItem = {
  question: string;
  answer: string;
};

/*
  Les montants et les délais cités ici ne sont jamais retapés : ils sont
  lus dans `pricing.ts`. Changer un prix à un seul endroit met donc à jour
  les offres, la console de mission, la FAQ et le balisage SEO d'un coup.
*/
const [exploration, orbite, galaxie] = plans;

export const faq: FaqItem[] = [
  {
    question: "Pourquoi avoir un site internet ?",
    answer:
      "Parce que la première chose que fait un client avant de vous appeler, c'est vous chercher. S'il ne trouve rien, il passe au suivant. Un site vous donne une adresse à vous, où vos informations sont claires, vos réalisations visibles et votre sérieux évident.",
  },
  {
    question: "Combien coûte un site ?",
    answer: `Trois missions, trois montants annoncés à l'avance : ${formatEuro(
      exploration.from,
    )} pour une page unique et complète, ${formatEuro(
      orbite.from,
    )} pour un site complet jusqu'à six pages, et ${formatEuro(
      galaxie.from,
    )} pour une expérience sur-mesure. Vous recevez toujours un montant fixe avant que nous commencions : aucune surprise en cours de route.`,
  },
  {
    question: "Combien de temps faut-il ?",
    answer: `Comptez ${exploration.days} jours pour une page unique, ${orbite.days} jours pour un site complet et ${galaxie.days} jours pour une mission sur-mesure. Le délai démarre une fois que nous avons vos informations et vos photos. Vous suivez l'avancement à chaque étape.`,
  },
  {
    question: "Puis-je modifier mon site ?",
    answer:
      "Oui. Soit vous nous envoyez un message et nous faisons la modification, soit nous vous donnons accès à une interface simple pour changer vos textes, vos photos et vos horaires vous-même. Aucune compétence technique nécessaire.",
  },
  {
    question: "Est-ce adapté aux petites entreprises ?",
    answer:
      "C'est exactement pour elles que nous travaillons. Un artisan seul, un commerce de quartier ou une équipe de trois personnes méritent la même qualité qu'une grande marque. Nous adaptons simplement l'ampleur du projet à votre réalité.",
  },
  {
    question: "Travaillez-vous avec des commerces locaux ?",
    answer:
      "Oui, c'est notre terrain de jeu. Nous sommes basés à Montereau-Fault-Yonne et nous accompagnons les commerçants, artisans et indépendants de Seine-et-Marne et d'Île-de-France. Nous travaillons aussi à distance partout en France.",
  },
  {
    question: "Que se passe-t-il après la mise en ligne ?",
    answer:
      "Votre site vous appartient. Vous pouvez le laisser vivre tel quel, ou souscrire au suivi mensuel : nous gérons l'hébergement, les mises à jour, les sauvegardes et vos modifications de contenu.",
  },
  {
    question: "Et si je n'ai ni logo, ni photos, ni textes ?",
    answer:
      "C'est le cas le plus fréquent. Nous vous guidons : quelles photos prendre, quoi écrire, dans quel ordre. Et si besoin, nous rédigeons les textes avec vous à partir d'une simple conversation.",
  },
];
