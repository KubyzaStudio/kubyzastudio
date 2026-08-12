/**
 * /api/reviews — lecture et dépôt des avis clients.
 *
 *   GET   renvoie les avis approuvés, du plus récent au plus ancien.
 *   POST  enregistre un nouvel avis, toujours au statut « pending ».
 *
 * POURQUOI LE NAVIGATEUR NE PARLE PAS À SUPABASE DIRECTEMENT
 * ==========================================================================
 * Trois raisons, dans l'ordre d'importance :
 *
 * 1. LE STATUT. Ici, `status: "pending"` est écrit par le serveur et jamais
 *    lu depuis la requête. Un client qui poste `{"status":"approved"}` voit
 *    son champ purement et simplement ignoré — il n'existe pas dans l'objet
 *    construit plus bas. La règle RLS `with check (status = 'pending')` dit
 *    déjà non ; ceci fait qu'on ne lui pose même pas la question.
 *
 * 2. LA CSP. `public/_headers` déclare `connect-src 'self'`. Un appel direct
 *    vers `*.supabase.co` serait bloqué par le navigateur. On pourrait élargir
 *    la directive — on préfère ne pas avoir à le faire : la politique de
 *    sécurité du site reste aussi étroite qu'avant cette fonctionnalité.
 *
 * 3. LA CLÉ. Aucune variable `NEXT_PUBLIC_*` n'est introduite : la clé
 *    anonyme ne quitte pas le serveur. Ce n'est pas indispensable — une clé
 *    anonyme est faite pour être publique — mais c'est gratuit ici, et une
 *    clé qu'on ne publie pas est une clé qu'on n'a pas à faire tourner.
 *
 * C'est le même schéma que `functions/api/contact.ts` : le site reste un
 * export statique, seule cette route s'exécute côté serveur.
 *
 * Variables d'environnement (Pages > Settings > Environment variables) :
 *   SUPABASE_URL       obligatoire — ex. https://xxxx.supabase.co
 *   SUPABASE_ANON_KEY  obligatoire — clé « anon / public » du projet
 *
 * La clé de service (`SUPABASE_SERVICE_ROLE_KEY`) n'est volontairement PAS
 * utilisée ici : elle contourne RLS. Les avis n'ont besoin d'aucun privilège
 * que la clé anonyme ne possède déjà.
 *
 * Binding facultatif :
 *   CONTACT_RATE_LIMIT  namespace KV, partagé avec le formulaire de contact
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  CONTACT_RATE_LIMIT?: {
    get(key: string): Promise<string | null>;
    put(
      key: string,
      value: string,
      options?: { expirationTtl?: number },
    ): Promise<void>;
  };
}

const MAX_BODY_BYTES = 4_000;
/** Nombre d'avis renvoyés au site. Au-delà, personne ne fait défiler. */
const PAGE_SIZE = 24;

const RATE_LIMIT_WINDOW_SECONDS = 86_400;
const RATE_LIMIT_MAX = 3;

/* Bornes alignées sur les `check` de `supabase/reviews.sql`. Les deux
   doivent bouger ensemble : la base est l'autorité, ceci est la courtoisie
   — elle permet de répondre un message clair plutôt qu'une erreur 400 nue. */
const NAME_MIN = 2;
const NAME_MAX = 80;
const CITY_MIN = 2;
const CITY_MAX = 80;
const QUOTE_MIN = 10;
const QUOTE_MAX = 1200;

/** Coupe, nettoie les caractères de contrôle et borne la longueur. */
function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Le commentaire garde ses retours à la ligne : c'est un texte, pas un champ. */
function cleanMultiline(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

function json(body: unknown, status = 200, cache = "no-store"): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cache,
    },
  });
}

function supabaseHeaders(env: Env): HeadersInit {
  const key = env.SUPABASE_ANON_KEY as string;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

/* ------------------------------------------------------------------ *
 * GET — les avis publiés
 * ------------------------------------------------------------------ */

export const onRequestGet = async (context: {
  env: Env;
}): Promise<Response> => {
  const { env } = context;

  // Supabase non configuré : ce n'est pas une erreur, c'est un site sans
  // avis. La section se replie proprement sur son invitation à en laisser un.
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return json({ reviews: [] }, 200, "public, max-age=60");
  }

  /* Le filtre `status=eq.approved` est redondant avec la règle RLS, qui
     interdit déjà de lire autre chose. Il est écrit quand même : si la
     politique était un jour assouplie par erreur, cette ligne resterait la
     seconde serrure. Deux verrous indépendants sur la même porte. */
  const query = new URLSearchParams({
    select: "id,created_at,name,city,rating,quote",
    status: "eq.approved",
    order: "created_at.desc",
    limit: String(PAGE_SIZE),
  });

  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/reviews?${query}`,
      { headers: supabaseHeaders(env) },
    );

    if (!response.ok) return json({ reviews: [] }, 200, "no-store");

    const rows = (await response.json()) as unknown;
    if (!Array.isArray(rows)) return json({ reviews: [] }, 200, "no-store");

    /* Une minute de cache au bord du réseau : un avis fraîchement approuvé
       apparaît en moins d'une minute, et une page très visitée ne réveille
       pas la base à chaque ouverture. `stale-while-revalidate` fait que
       personne n'attend jamais la revalidation. */
    return json(
      { reviews: rows },
      200,
      "public, max-age=60, stale-while-revalidate=300",
    );
  } catch {
    return json({ reviews: [] }, 200, "no-store");
  }
};

/* ------------------------------------------------------------------ *
 * POST — un visiteur dépose un avis
 * ------------------------------------------------------------------ */

async function isRateLimited(env: Env, ip: string): Promise<boolean> {
  const kv = env.CONTACT_RATE_LIMIT;
  if (!kv || !ip) return false;

  const key = `review:${ip}`;
  const current = Number((await kv.get(key)) ?? "0");
  if (current >= RATE_LIMIT_MAX) return true;

  await kv.put(key, String(current + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
  });
  return false;
}

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const { request, env } = context;

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return json({ error: "reviews_unavailable" }, 503);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return json({ error: "payload_too_large" }, 413);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  // Piège à robots : on répond « ok » pour ne rien apprendre à l'expéditeur.
  if (clean(payload.website, 200).length > 0) {
    return json({ ok: true });
  }

  const name = clean(payload.name, NAME_MAX);
  const city = clean(payload.city, CITY_MAX);
  const quote = cleanMultiline(payload.quote, QUOTE_MAX);
  const rating = Math.trunc(Number(payload.rating));

  if (name.length < NAME_MIN) return json({ error: "name_required" }, 422);
  if (city.length < CITY_MIN) return json({ error: "city_required" }, 422);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return json({ error: "rating_required" }, 422);
  }
  if (quote.length < QUOTE_MIN) return json({ error: "quote_required" }, 422);

  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  if (await isRateLimited(env, ip)) {
    return json({ error: "rate_limited" }, 429);
  }

  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/reviews`, {
      method: "POST",
      headers: { ...supabaseHeaders(env), Prefer: "return=minimal" },
      /* L'objet est construit champ par champ, jamais étalé depuis la
         requête. `status` vaut « pending » parce que c'est écrit ici, et
         aucune clé inconnue envoyée par le client n'atteint la base. */
      body: JSON.stringify({
        name,
        city,
        rating,
        quote,
        status: "pending",
        source_ip: ip || null,
      }),
    });

    if (!response.ok) return json({ error: "storage_failed" }, 502);
    return json({ ok: true }, 201);
  } catch {
    return json({ error: "storage_failed" }, 502);
  }
};
