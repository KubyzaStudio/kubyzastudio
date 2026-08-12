"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { Close, Star } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

/**
 * Le formulaire ne part jamais avec la page.
 *
 * `ssr: false` est ici le bon réglage, et c'est l'un des rares endroits du
 * site où il l'est : le contenu du formulaire n'a aucune valeur pour un
 * moteur de recherche — ce sont des champs vides — et il n'est visible
 * qu'après un clic délibéré. Son code est donc absent du chargement
 * initial et n'est demandé qu'à l'ouverture du volet, où les quelques
 * dizaines de millisecondes de récupération se confondent avec les 700 ms
 * d'animation d'ouverture. Personne ne les voit passer.
 */
const ReviewForm = dynamic(
  () => import("./ReviewForm").then((m) => m.ReviewForm),
  {
    ssr: false,
    loading: () => (
      <div className="py-10 text-center">
        <span className="font-mono text-[0.625rem] tracking-[0.22em] text-dim uppercase">
          Ouverture du formulaire…
        </span>
      </div>
    ),
  },
);

const EASE = [0.16, 1, 0.3, 1] as const;

export type Review = {
  id: string;
  created_at: string;
  name: string;
  city: string;
  rating: number;
  quote: string;
};

/**
 * LES AVIS
 * ==========================================================================
 * Cette section remplace la promesse que faisait la précédente — « aucun avis
 * n'est affiché tant qu'il n'a pas été recueilli et autorisé ». La promesse
 * tient toujours, à ceci près qu'elle est maintenant appliquée par la base de
 * données plutôt que par l'absence de fonctionnalité : seul un avis passé au
 * statut « approved » depuis Supabase parvient jusqu'ici.
 *
 * CE QUI SE CHARGE, ET QUAND
 * --------------------------------------------------------------------------
 * Le site est un export statique : la liste ne peut pas être rendue au build,
 * sans quoi il faudrait redéployer pour publier un avis. Elle est donc lue
 * côté client — mais pas à l'ouverture de la page. Un `IntersectionObserver`
 * attend que la section approche de l'écran, et c'est seulement à ce
 * moment-là que la requête part. Un visiteur qui ne descend jamais jusqu'ici
 * ne déclenche aucun appel réseau.
 *
 * La section réserve sa hauteur dès le premier rendu : que la réponse arrive
 * en 40 ms ou en deux secondes, rien ne se décale sous le doigt.
 */
export function Avis() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/reviews");
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { reviews?: Review[] };
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
    } catch {
      // Un avis manquant n'est pas une panne : la section garde son
      // invitation, et le visiteur peut toujours en déposer un.
      setReviews([]);
    }
  }, []);

  useEffect(() => {
    const el = anchor.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        void load();
      },
      // 400 px d'avance : la liste est là avant que la section ne le soit.
      { rootMargin: "400px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [load]);

  // Le panneau ouvert fige la page derrière lui, comme le journal de bord.
  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const average =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <section id="avis" ref={anchor} className="relative isolate py-28 sm:py-40">
      <div className="container-x">
        <SectionMarker code="09" label="Avis" />

        <div className="mt-14 grid gap-14 sm:mt-20 lg:grid-cols-12 lg:gap-16">
          {/* --- L'invitation ------------------------------------------ */}
          <div className="lg:col-span-5">
            <h2 className="type-safe font-display text-[clamp(1.8rem,4.2vw,3.2rem)] leading-[0.96] font-medium tracking-[-0.04em] text-star">
              Votre expérience
              <span className="text-dim"> compte.</span>
            </h2>

            <p className="mt-6 max-w-md text-sm leading-relaxed text-mist sm:text-base">
              Vous avez travaillé avec Kubyza Studio ? Partagez votre
              expérience — elle aidera la prochaine personne à savoir à qui
              elle s&apos;adresse.
            </p>

            <div className="mt-9">
              <Button size="lg" onClick={() => setOpen(true)}>
                <span aria-hidden="true" className="text-accent-glow">
                  ✦
                </span>
                Laisser un avis
              </Button>
            </div>

            <p className="mt-5 max-w-xs text-xs leading-relaxed text-dim">
              Chaque avis est lu et vérifié avant publication. Aucun n&apos;est
              écrit par le studio.
            </p>

            {/* La moyenne n'apparaît qu'à partir de trois avis : en dessous,
                un chiffre ne dit rien et prétend dire quelque chose. */}
            {reviews && reviews.length >= 3 && (
              <Reveal blur={false} y={10} className="mt-10">
                <div className="hairline" />
                <div className="mt-6 flex items-center gap-4">
                  <Stars value={Math.round(average)} className="h-4 w-4" />
                  <span className="font-mono text-[0.6875rem] tracking-[0.16em] text-mist tabular-nums">
                    {average.toFixed(1).replace(".", ",")} / 5 ·{" "}
                    {reviews.length} avis
                  </span>
                </div>
              </Reveal>
            )}
          </div>

          {/* --- Les avis publiés -------------------------------------- */}
          <div className="lg:col-span-7">
            <ReviewList reviews={reviews} />
          </div>
        </div>
      </div>

      <ReviewPanel open={open} onClose={() => setOpen(false)} />
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * La liste
 * ------------------------------------------------------------------ */

function ReviewList({ reviews }: { reviews: Review[] | null }) {
  /* Tant que la réponse n'est pas là, trois cartes fantômes occupent la
     place exacte des vraies. Ce n'est pas un décor d'attente : c'est ce qui
     empêche la page de sauter quand la liste arrive. */
  if (reviews === null) {
    return (
      <ul className="space-y-px" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="border-t border-edge/50 py-8"
            style={{ opacity: 1 - i * 0.25 }}
          >
            <div className="h-3 w-24 rounded-full bg-ink/70" />
            <div className="mt-5 h-3 w-full rounded-full bg-ink/50" />
            <div className="mt-2.5 h-3 w-4/5 rounded-full bg-ink/40" />
            <div className="mt-5 h-2.5 w-32 rounded-full bg-ink/30" />
          </li>
        ))}
      </ul>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex h-full min-h-64 flex-col justify-center border-t border-edge/50 py-10">
        <p className="max-w-sm text-sm leading-relaxed text-mist">
          Aucun avis n&apos;est encore publié.
        </p>
        <p className="mt-3 max-w-sm text-xs leading-relaxed text-dim">
          Le studio préfère une page vide à des témoignages fabriqués. Le
          premier avis affiché ici sera un vrai, écrit par un vrai client.
        </p>
      </div>
    );
  }

  return (
    <ul>
      {reviews.map((review, index) => (
        <Reveal
          as="li"
          key={review.id}
          delay={Math.min(index, 4) * 0.05}
          y={14}
          blur={false}
          className="border-t border-edge/50 first:border-t-0 lg:first:border-t"
        >
          <article className="py-8 sm:py-9">
            <Stars value={review.rating} className="h-3.5 w-3.5" />

            {/* `text-pretty` évite le mot esseulé en fin de citation, et
                `break-words` protège des adresses ou mots très longs collés
                dans un avis : sur un écran de 320 px, un seul mot de 40
                caractères suffirait à ouvrir une barre horizontale. */}
            <blockquote className="mt-5 text-base leading-relaxed text-balance break-words text-mist">
              {review.quote}
            </blockquote>

            <footer className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <cite className="font-display text-sm font-medium text-star not-italic">
                {review.name}
              </cite>
              <span aria-hidden="true" className="text-dim">
                ·
              </span>
              <span className="font-mono text-[0.5625rem] tracking-[0.2em] text-dim uppercase">
                {review.city}
              </span>
            </footer>
          </article>
        </Reveal>
      ))}
    </ul>
  );
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <div
      className="flex gap-1"
      role="img"
      aria-label={`Note : ${value} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          filled={star <= value}
          aria-hidden="true"
          className={cn(className, star <= value ? "text-accent-soft" : "text-edge")}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Le panneau de dépôt
 * ------------------------------------------------------------------ */

/**
 * Le formulaire s'ouvre dans un volet plein écran, exactement comme le
 * journal de bord du HUD : même fond, même flou, même courbe d'ouverture par
 * le bas. Le visiteur reconnaît le geste — c'est le seul du site qui
 * recouvre la page, et il en a déjà fait l'expérience dans le menu.
 */
function ReviewPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="review-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Laisser un avis"
          className="fixed inset-0 z-80 flex flex-col justify-center overflow-y-auto overscroll-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.35, delay: 0.1 } }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 origin-bottom bg-void/94 backdrop-blur-2xl"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.7, ease: [0.83, 0, 0.17, 1] }}
          />

          {/* Rattrapage du clic hors panneau, sans intercepter le formulaire.
              `aria-hidden` est délibéré : au clavier et au lecteur d'écran, la
              fermeture passe par le bouton explicite et par Échap. Annoncer en
              plus une zone « Fermer » large comme l'écran n'ajouterait aucune
              capacité — seulement un obstacle de plus à franchir avant
              d'atteindre le premier champ. */}
          <div
            aria-hidden="true"
            onClick={onClose}
            className="absolute inset-0 cursor-default"
          />

          <motion.div
            className="relative container-x py-20 sm:py-24"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12, transition: { duration: 0.25 } }}
            transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
          >
            <PanelBody onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Le contenu du volet, et l'endroit où vit `done`.
 *
 * Ce découpage n'est pas cosmétique. `ReviewPanel` reste monté en permanence
 * — c'est `AnimatePresence` qui monte et démonte ce qu'il contient. Un état
 * « avis envoyé » gardé au niveau du volet survivrait donc à la fermeture :
 * un visiteur qui envoie un avis, ferme, puis rouvre pour en écrire un
 * second trouverait le titre figé sur « C'est envoyé. » au-dessus d'un
 * formulaire vierge.
 *
 * En le plaçant ici, dans un composant que la fermeture démonte réellement,
 * la remise à zéro devient une propriété du cycle de vie plutôt qu'un effet
 * à écrire — et il n'y a plus rien à penser au moment de fermer.
 */
function PanelBody({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState(false);

  return (
    <div className="glass mx-auto max-w-2xl rounded-panel p-6 sm:p-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <span className="label-mono">Votre expérience</span>
          <h3 className="type-safe mt-3 font-display text-2xl leading-tight font-medium text-star sm:text-3xl">
            {done ? "C'est envoyé." : "Racontez-nous."}
          </h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le formulaire"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-edge/70 text-mist transition-colors duration-400 hover:border-accent-soft/60 hover:text-star"
        >
          <Close className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-8">
        <ReviewForm onSent={() => setDone(true)} />
      </div>
    </div>
  );
}
