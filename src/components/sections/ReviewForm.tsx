"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { ArrowUpRight, Check, Star } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/* Bornes alignées sur `functions/api/reviews.ts` et sur les contraintes
   `check` de `supabase/reviews.sql`. Les trois disent la même chose : ici
   pour guider, là pour valider, et dans la base pour garantir. */
const NAME_MIN = 2;
const CITY_MIN = 2;
const QUOTE_MIN = 10;
const QUOTE_MAX = 1200;

type Status = "idle" | "sending" | "sent" | "error";

/**
 * « Laisser un avis » — un seul écran, quatre champs, aucune étape.
 *
 * Le formulaire de mission demande quatre écrans parce qu'il qualifie un
 * projet. Celui-ci demande une impression : le découper serait le rendre
 * plus long qu'il n'est. Tout tient sous le pouce, sans défilement sur un
 * téléphone courant.
 */
export function ReviewForm({ onSent }: { onSent?: () => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState(0);
  const [quote, setQuote] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const openedAt = useRef(0);

  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  function validate(): string | null {
    if (name.trim().length < NAME_MIN) return "Indiquez votre prénom ou votre nom.";
    if (city.trim().length < CITY_MIN) return "Indiquez votre ville.";
    if (rating < 1) return "Choisissez une note, de une à cinq étoiles.";
    if (quote.trim().length < QUOTE_MIN) {
      return "Dites-nous un mot de plus : quelques mots suffisent, mais pas trois.";
    }
    return null;
  }

  async function submit() {
    const issue = validate();
    if (issue) {
      setError(issue);
      return;
    }

    // Robots : champ piège renseigné, ou formulaire rempli instantanément.
    if (website || Date.now() - openedAt.current < 2500) {
      setStatus("sent");
      onSent?.();
      return;
    }

    setStatus("sending");
    setError(null);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim(),
          rating,
          quote: quote.trim(),
          website,
        }),
      });

      if (!response.ok) throw new Error(String(response.status));
      setStatus("sent");
      onSent?.();
    } catch {
      setStatus("error");
      setError(
        "L'envoi n'a pas abouti. Réessayez dans un instant — votre texte est conservé.",
      );
    }
  }

  if (status === "sent") {
    return (
      <motion.div
        className="flex flex-col items-center px-2 py-10 text-center sm:py-14"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-accent-soft/60 bg-accent/15 text-accent-glow">
          <Check className="h-6 w-6" />
        </span>
        <p className="label-mono mt-8">Avis reçu</p>
        <h3 className="mt-4 max-w-sm font-display text-2xl leading-tight font-medium text-star sm:text-3xl">
          Merci pour votre avis !
        </h3>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist">
          Il sera vérifié par notre équipe avant d&apos;être publié. Vous le
          verrez apparaître sur cette page une fois validé.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="px-1 py-2"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Votre nom"
          hint="Prénom, ou prénom et initiale — comme vous préférez."
          value={name}
          onChange={(v) => {
            setName(v);
            setError(null);
          }}
          autoComplete="name"
          maxLength={80}
        />
        <Field
          label="Votre ville"
          hint="Montereau, Melun, Sens…"
          value={city}
          onChange={(v) => {
            setCity(v);
            setError(null);
          }}
          autoComplete="address-level2"
          maxLength={80}
        />
      </div>

      <div className="mt-8">
        <RatingInput
          value={rating}
          onChange={(v) => {
            setRating(v);
            setError(null);
          }}
        />
      </div>

      <div className="mt-8">
        <Field
          label="Votre avis"
          hint="Ce qui vous a marqué, en toute simplicité."
          value={quote}
          onChange={(v) => {
            setQuote(v);
            setError(null);
          }}
          multiline
          maxLength={QUOTE_MAX}
        />
        <p className="mt-2 text-right font-mono text-[0.625rem] text-dim tabular-nums">
          {quote.length} / {QUOTE_MAX}
        </p>
      </div>

      {/* Piège à robots — hors flux et hors lecture d'écran. */}
      <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
        <label>
          Ne pas remplir
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <div aria-live="polite" className="min-h-6">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-sm text-accent-glow"
          >
            {error}
          </motion.p>
        )}
      </div>

      <div className="mt-8 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-xs leading-relaxed text-dim">
          Votre avis sera vérifié avant publication. Nous ne demandons ni email
          ni téléphone.
        </p>

        <Button
          type="submit"
          size="lg"
          disabled={status === "sending"}
          className="w-full sm:w-auto"
        >
          {status === "sending" ? (
            "Transmission…"
          ) : (
            <>
              Envoyer mon avis
              <ArrowUpRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */

/**
 * LES CINQ ÉTOILES
 * ==========================================================================
 * C'est un `radiogroup`, pas une rangée de boutons : les flèches du clavier
 * parcourent la note, et un lecteur d'écran annonce « 4 sur 5 » plutôt que
 * « bouton, bouton, bouton, bouton, bouton ».
 *
 * La cible tactile fait 44 px de côté — la recommandation d'Apple comme celle
 * de Google — alors que l'étoile dessinée n'en fait que 28. Le surplus est
 * du remplissage transparent : au doigt, on ne rate pas la quatrième étoile
 * parce qu'on visait entre deux.
 */
function RatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const labelId = useId();

  const LABELS = [
    "",
    "Décevant",
    "Moyen",
    "Bien",
    "Très bien",
    "Excellent",
  ] as const;

  return (
    <div>
      <span
        id={labelId}
        className="block font-mono text-[0.625rem] tracking-[0.18em] text-dim uppercase"
      >
        Votre note
      </span>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div
          role="radiogroup"
          aria-labelledby={labelId}
          className="flex"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= shown;
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={value === star}
                aria-label={`${star} étoile${star > 1 ? "s" : ""} sur 5`}
                onClick={() => onChange(star)}
                onMouseEnter={() => setHover(star)}
                onFocus={() => setHover(star)}
                onBlur={() => setHover(0)}
                className="flex h-11 w-11 items-center justify-center"
              >
                <Star
                  filled={active}
                  className={cn(
                    "h-7 w-7 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    active
                      ? "scale-105 text-accent-glow drop-shadow-[0_0_10px_rgba(110,151,255,0.55)]"
                      : "scale-100 text-edge",
                  )}
                />
              </button>
            );
          })}
        </div>

        {/* Le mot ne remplace pas la note : il la confirme. Sa boîte est
            réservée en permanence pour qu'aucune ligne ne saute quand il
            apparaît. */}
        <span className="min-h-5 text-sm text-mist">{LABELS[shown] ?? ""}</span>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  multiline,
  ...rest
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  autoComplete?: string;
  maxLength?: number;
}) {
  /* `text-base` (16 px) n'est pas un choix esthétique : en dessous de cette
     taille, Safari iOS zoome automatiquement sur le champ à la mise au
     point, et le visiteur se retrouve avec une page décadrée qu'il doit
     repincer. Toute la saisie du site est à 16 px pour cette raison. */
  const shared =
    "mt-2.5 w-full border-b border-edge/70 bg-transparent pb-2.5 text-base text-star transition-colors duration-300 outline-none placeholder:text-dim focus:border-accent-soft";

  return (
    <label className="group/field block">
      <span className="block font-mono text-[0.625rem] tracking-[0.18em] text-dim uppercase transition-colors duration-300 group-focus-within/field:text-accent-soft">
        {label}
      </span>

      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className={cn(shared, "resize-none")}
          {...rest}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={shared}
          {...rest}
        />
      )}

      {hint && <span className="mt-2 block text-xs text-dim">{hint}</span>}
    </label>
  );
}
