"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check } from "@/components/ui/Icons";
import { useMission } from "@/components/providers/MissionContext";
import { cn, formatEuro } from "@/lib/utils";
import { site } from "@/data/site";

const PROJECT_TYPES = [
  "Une page unique",
  "Site vitrine",
  "Refonte",
  "Site sur-mesure",
  "Je ne sais pas encore",
];

/*
  Les paliers de budget encadrent les trois missions (199 €, 699 €,
  1 399 €) : le visiteur se reconnaît dans une fourchette au lieu de
  deviner. Modifier un prix dans `pricing.ts` demande de revoir ces bornes.
*/
const BUDGETS = [
  "Autour de 200 €",
  "300 € – 800 €",
  "800 € – 1 600 €",
  "Plus de 1 600 €",
  "À définir ensemble",
];

type Form = {
  activity: string;
  company: string;
  projectType: string;
  goal: string;
  budget: string;
  message: string;
  name: string;
  email: string;
  phone: string;
  /** Piège à robots : invisible, doit rester vide. */
  website: string;
};

const EMPTY: Form = {
  activity: "",
  company: "",
  projectType: "",
  goal: "",
  budget: "",
  message: "",
  name: "",
  email: "",
  phone: "",
  website: "",
};

const STEPS = [
  { title: "Votre activité", hint: "Pour comprendre à qui nous parlons." },
  { title: "Votre objectif", hint: "Ce que le site doit accomplir." },
  { title: "Votre projet", hint: "L'ampleur et le contexte." },
  { title: "Vos coordonnées", hint: "Pour vous répondre." },
];

const EASE = [0.16, 1, 0.3, 1] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Envoi du formulaire via Web3Forms.
 *
 * Web3Forms est appelé directement depuis le navigateur, conformément à
 * l'usage de leur offre gratuite : leur plan gratuit refuse les appels
 * serveur (403, « Use our API in client side »). La Function `/api/contact`
 * est appelée en parallèle pour valider et archiver la demande dans Supabase.
 *
 * ⚠ CETTE CLÉ EST FIGÉE AU BUILD, PAS LUE À L'EXÉCUTION
 * --------------------------------------------------------------------------
 * `NEXT_PUBLIC_*` n'est pas une variable d'environnement au sens habituel :
 * Next la remplace par sa valeur littérale pendant `next build`, et le site
 * étant un export statique, plus rien ne la relit ensuite. La poser dans
 * Cloudflare Pages ne suffit donc pas — il faut qu'elle y soit AVANT le
 * build, et un changement de valeur exige un redéploiement.
 *
 * Vide, la constante ne provoque aucune erreur visible : `sendViaWeb3Forms`
 * répond simplement `false`, et le formulaire ne repose plus que sur
 * l'archivage Supabase. Vérifier les deux ensemble, jamais l'un seul.
 */
const WEB3FORMS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ?? "";

async function sendViaWeb3Forms(form: Form, brief: string): Promise<boolean> {
  if (!WEB3FORMS_KEY) return false;

  const lignes = [
    ["Métier", form.activity],
    ["Entreprise", form.company],
    ["Type de projet", form.projectType],
    ["Objectif", form.goal],
    ["Budget", form.budget],
    ["Configuration", brief],
    ["Nom", form.name],
    ["Email", form.email],
    ["Téléphone", form.phone],
    ["Message", form.message],
  ]
    .filter(([, valeur]) => valeur)
    .map(([etiquette, valeur]) => `${etiquette} : ${valeur}`)
    .join("\n");

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `Mission · ${form.activity}${form.company ? ` — ${form.company}` : ""}`,
        from_name: "Kubyza Studio",
        message: lignes,
        // Permet de répondre directement depuis la boîte de réception.
        ...(form.email ? { email: form.email, replyto: form.email } : {}),
      }),
    });

    /* Web3Forms peut répondre 200 avec `{"success": false}` — clé désactivée,
       quota atteint. S'en tenir au code HTTP annoncerait au visiteur un envoi
       qui n'a pas eu lieu, ce que tout le reste de ce fichier s'applique
       justement à éviter. */
    if (!response.ok) return false;
    const body = (await response.json()) as { success?: boolean };
    return body.success === true;
  } catch {
    return false;
  }
}

type Status = "idle" | "sending" | "sent" | "error";

/**
 * « Préparer votre mission » — quatre écrans courts plutôt qu'un long formulaire.
 * Chaque étape ne pose qu'une seule vraie question : le visiteur ne décroche pas.
 */
export function ContactForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const openedAt = useRef(0);
  const { plan, summary, estimate, setBrief } = useMission();

  // Horodatage d'ouverture : sert à repérer les envois instantanés des robots.
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const brief = useMemo(() => {
    const parts: string[] = [];
    if (plan) parts.push(`Offre : ${plan}`);
    if (summary) parts.push(summary);
    if (estimate) {
      parts.push(`Estimation : ${formatEuro(estimate[0])} – ${formatEuro(estimate[1])}`);
    }
    return parts;
  }, [plan, summary, estimate]);

  function validate(index: number): string | null {
    if (index === 0 && form.activity.trim().length < 2) {
      return "Dites-nous simplement votre métier.";
    }
    if (index === 1 && !form.projectType) {
      return "Choisissez ce qui ressemble le plus à votre besoin.";
    }
    if (index === 3) {
      const hasEmail = form.email.trim().length > 0;
      const hasPhone = form.phone.trim().length > 0;
      if (!hasEmail && !hasPhone) {
        return "Laissez-nous un email ou un téléphone pour vous répondre.";
      }
      if (hasEmail && !EMAIL_RE.test(form.email.trim())) {
        return "Cet email semble incomplet.";
      }
    }
    return null;
  }

  function next() {
    const issue = validate(step);
    if (issue) {
      setError(issue);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit() {
    const issue = validate(3);
    if (issue) {
      setError(issue);
      return;
    }
    // Robots : formulaire rempli instantanément ou champ piège renseigné.
    if (form.website || Date.now() - openedAt.current < 2500) {
      setStatus("sent");
      return;
    }

    setStatus("sending");
    setError(null);

    const payload = { ...form, brief: brief.join(" · ") };

    /* LES DEUX CHEMINS PARTENT ENSEMBLE, ET AUCUN N'EST CONDITIONNÉ À L'AUTRE
       ======================================================================
       L'ordre précédent était : envoyer par Web3Forms, puis archiver *si*
       l'envoi avait abouti. Il rendait l'archivage inatteignable exactement
       le jour où il servait — clé Web3Forms absente du build, quota atteint,
       compte suspendu — et la demande d'un client était alors perdue pour de
       bon : pas d'email, pas de ligne en base, un message d'erreur, et plus
       rien nulle part.

       Les deux appels partent donc maintenant en parallèle, sans que l'un
       puisse empêcher l'autre. Le succès est annoncé dès que l'un des deux a
       réellement abouti — `archived` vient du serveur et ne vaut `true` que
       si l'insertion Supabase a été acceptée, jamais par défaut. Un « c'est
       noté » affiché ici correspond donc toujours à une demande que le
       studio peut lire quelque part. */
    const [delivered, archived] = await Promise.all([
      sendViaWeb3Forms(form, payload.brief),
      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(async (response) => {
          if (!response.ok) return false;
          const corps = (await response.json()) as { archived?: boolean };
          return corps.archived === true;
        })
        .catch(() => false),
    ]);

    if (!delivered && !archived) {
      setStatus("error");
      setError(
        "L'envoi n'a pas abouti. Écrivez-nous directement, on vous répond aussi vite.",
      );
      return;
    }

    setStatus("sent");
    setBrief({});
  }

  if (status === "sent") {
    return (
      <motion.div
        className="glass flex flex-col items-center rounded-panel px-8 py-16 text-center sm:px-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-accent-soft/60 bg-accent/15 text-accent-glow">
          <Check className="h-6 w-6" />
        </span>
        <p className="label-mono mt-8">Mission enregistrée</p>
        <h3 className="mt-4 font-display text-2xl leading-tight font-medium text-star sm:text-3xl">
          C&apos;est noté. Nous revenons vers vous sous 24 h.
        </h3>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist">
          Vous recevrez une première proposition claire : ce que nous ferions,
          combien de temps cela prend, et combien cela coûte.
        </p>
        <a
          href={`mailto:${site.contact.email}`}
          className="mt-8 text-sm text-accent-soft transition-colors duration-300 hover:text-accent-glow"
        >
          {site.contact.email}
        </a>
      </motion.div>
    );
  }

  return (
    <div className="glass overflow-hidden rounded-panel">
      {/* Bandeau d'étape. */}
      <div className="border-b border-edge/50 bg-void/50 px-6 py-5 sm:px-9">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <span className="font-mono text-[0.5625rem] tracking-[0.22em] text-accent-soft uppercase sm:text-[0.625rem]">
              Étape {step + 1} / {STEPS.length}
            </span>
            <p className="mt-2 font-display text-lg leading-none font-medium text-star sm:text-xl">
              {STEPS[step].title}
            </p>
          </div>
          <span className="hidden text-right text-xs text-dim sm:block">
            {STEPS[step].hint}
          </span>
        </div>

        {/* Jauge de progression. */}
        <div className="mt-5 flex gap-1.5" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className="h-px flex-1 overflow-hidden bg-ink">
              <motion.span
                className="block h-full bg-linear-to-r from-accent to-accent-glow"
                initial={false}
                animate={{ width: i <= step ? "100%" : "0%" }}
                transition={{ duration: 0.6, ease: EASE }}
              />
            </span>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step < STEPS.length - 1) next();
          else void submit();
        }}
        className="p-6 sm:p-9"
      >
        {brief.length > 0 && (
          <div className="mb-8 rounded-card border border-accent-soft/25 bg-accent/6 p-4">
            <span className="font-mono text-[0.5625rem] tracking-[0.2em] text-accent-soft uppercase">
              Votre configuration
            </span>
            <p className="mt-2 text-xs leading-relaxed text-mist">
              {brief.join(" · ")}
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="space-y-6"
          >
            {step === 0 && (
              <>
                <Field
                  label="Votre métier"
                  hint="Coiffeur, menuisier, restaurant, garage…"
                  value={form.activity}
                  onChange={(v) => set("activity", v)}
                  autoFocus
                  required
                />
                <Field
                  label="Nom de votre entreprise"
                  hint="Facultatif"
                  value={form.company}
                  onChange={(v) => set("company", v)}
                />
              </>
            )}

            {step === 1 && (
              <>
                <ChipGroup
                  label="De quoi avez-vous besoin ?"
                  options={PROJECT_TYPES}
                  value={form.projectType}
                  onChange={(v) => set("projectType", v)}
                />
                <Field
                  label="Qu'attendez-vous de ce site ?"
                  hint="Facultatif — être trouvé, montrer votre travail, recevoir des demandes…"
                  value={form.goal}
                  onChange={(v) => set("goal", v)}
                />
              </>
            )}

            {step === 2 && (
              <>
                <ChipGroup
                  label="Budget envisagé"
                  options={BUDGETS}
                  value={form.budget}
                  onChange={(v) => set("budget", v)}
                />
                <Field
                  label="Un mot sur votre projet"
                  hint="Facultatif"
                  value={form.message}
                  onChange={(v) => set("message", v)}
                  multiline
                />
              </>
            )}

            {step === 3 && (
              <>
                <Field
                  label="Votre nom"
                  hint="Facultatif"
                  value={form.name}
                  onChange={(v) => set("name", v)}
                  autoFocus
                  autoComplete="name"
                />
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => set("email", v)}
                    autoComplete="email"
                    inputMode="email"
                  />
                  <Field
                    label="Téléphone"
                    type="tel"
                    value={form.phone}
                    onChange={(v) => set("phone", v)}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                </div>
                <p className="text-xs leading-relaxed text-dim">
                  Un des deux suffit. Vos informations servent uniquement à
                  répondre à votre demande.
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Piège à robots — hors flux et hors lecture d'écran. */}
        <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden">
          <label>
            Ne pas remplir
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
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

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className={cn(
              "inline-flex items-center gap-2 self-start text-sm text-dim transition-colors duration-300 hover:text-star",
              step === 0 && "pointer-events-none opacity-0",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>

          <Button
            type="submit"
            size="lg"
            disabled={status === "sending"}
            className="w-full sm:w-auto"
          >
            {step < STEPS.length - 1 ? (
              <>
                Continuer
                <ArrowRight className="h-4 w-4" />
              </>
            ) : status === "sending" ? (
              "Transmission…"
            ) : (
              <>
                Envoyer ma demande
                <ArrowUpRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Field({
  label,
  hint,
  value,
  onChange,
  type = "text",
  multiline,
  ...rest
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "email" | "tel" | "text";
}) {
  const shared =
    "mt-2.5 w-full border-b border-edge/70 bg-transparent pb-2.5 text-base text-star transition-colors duration-300 outline-none placeholder:text-dim focus:border-accent-soft";

  // Intitulé toujours visible : nos visiteurs ne devinent pas un champ vide.
  return (
    <label className="group/field block">
      <span className="block font-mono text-[0.625rem] tracking-[0.18em] text-dim uppercase transition-colors duration-300 group-focus-within/field:text-accent-soft">
        {label}
      </span>

      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={cn(shared, "resize-none")}
          {...rest}
        />
      ) : (
        <input
          type={type}
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

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="font-mono text-[0.625rem] tracking-[0.18em] text-dim uppercase">
        {label}
      </legend>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {options.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option)}
              className={cn(
                "rounded-full border px-4 py-2.5 text-sm transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
                active
                  ? "border-accent-soft/70 bg-accent/15 text-star shadow-[0_0_28px_-10px_rgba(61,107,255,0.9)]"
                  : "border-edge/70 text-mist hover:border-edge hover:text-star",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
