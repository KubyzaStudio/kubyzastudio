/**
 * POST /api/contact — réception des demandes de mission.
 *
 * Cloudflare Pages Function : le site reste 100 % statique, seule cette route
 * s'exécute côté serveur. Elle ne dépend d'aucun paquet npm.
 *
 * Variables d'environnement (Pages > Settings > Environment variables) :
 *   SUPABASE_URL              facultatif — archivage des demandes
 *   SUPABASE_SERVICE_ROLE_KEY facultatif
 *
 * Binding facultatif :
 *   CONTACT_RATE_LIMIT        namespace KV pour la limitation par IP
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  CONTACT_RATE_LIMIT?: {
    get(key: string): Promise<string | null>;
    put(
      key: string,
      value: string,
      options?: { expirationTtl?: number },
    ): Promise<void>;
  };
}

type Payload = Record<string, unknown>;

const MAX_BODY_BYTES = 12_000;
const RATE_LIMIT_WINDOW_SECONDS = 3600;
const RATE_LIMIT_MAX = 5;

const FIELD_LIMITS: Record<string, number> = {
  activity: 120,
  company: 120,
  projectType: 60,
  goal: 400,
  budget: 60,
  message: 3000,
  name: 120,
  email: 160,
  phone: 40,
  brief: 600,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Coupe, nettoie les caractères de contrôle et borne la longueur. */
function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, max);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function isRateLimited(env: Env, ip: string): Promise<boolean> {
  const kv = env.CONTACT_RATE_LIMIT;
  if (!kv || !ip) return false;

  const key = `contact:${ip}`;
  const current = Number((await kv.get(key)) ?? "0");
  if (current >= RATE_LIMIT_MAX) return true;

  await kv.put(key, String(current + 1), {
    expirationTtl: RATE_LIMIT_WINDOW_SECONDS,
  });
  return false;
}

/**
 * L'envoi du mail est fait par Web3Forms côté navigateur dans
 * `src/components/sections/ContactForm.tsx`.
 *
 * Cette Function sert uniquement à valider et archiver la demande dans
 * Supabase. Elle ne contient donc aucun service d'envoi d'email.
 */

/**
 * Enregistre la demande, et DIT SI ELLE L'A ÉTÉ.
 *
 * Le booléen n'est pas décoratif. Le navigateur montre l'écran « Mission
 * enregistrée » dès que l'un des deux chemins a abouti — l'email Web3Forms
 * ou cet archivage. Répondre « oui » sans avoir rien écrit ferait donc
 * afficher un succès pour une demande qui n'existe nulle part.
 *
 * D'où les deux points de vigilance ci-dessous :
 *   — Supabase non configuré, c'est `false`, pas un succès par défaut ;
 *   — un `INSERT` refusé par PostgREST (colonne manquante, RLS) répond un
 *     code 4xx tout à fait normal, sans lever d'exception. Sans le
 *     `response.ok`, cet échec-là passerait pour un enregistrement.
 */
async function archive(
  env: Env,
  record: Record<string, string>,
): Promise<boolean> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return false;

  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/contact_requests`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(record),
  });

  return response.ok;
}

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const { request, env } = context;

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return json({ error: "payload_too_large" }, 413);
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  // Piège à robots : on répond « ok » pour ne rien apprendre à l'expéditeur.
  if (clean(payload.website, 200).length > 0) {
    return json({ ok: true });
  }

  const fields: Record<string, string> = {};
  for (const [key, max] of Object.entries(FIELD_LIMITS)) {
    fields[key] = clean(payload[key], max);
  }

  if (fields.activity.length < 2) {
    return json({ error: "activity_required" }, 422);
  }
  if (!fields.email && !fields.phone) {
    return json({ error: "contact_required" }, 422);
  }
  if (fields.email && !EMAIL_RE.test(fields.email)) {
    return json({ error: "invalid_email" }, 422);
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  if (await isRateLimited(env, ip)) {
    return json({ error: "rate_limited" }, 429);
  }

  let archived = false;
  try {
    archived = await archive(env, {
      created_at: new Date().toISOString(),
      activity: fields.activity,
      company: fields.company,
      project_type: fields.projectType,
      goal: fields.goal,
      budget: fields.budget,
      message: fields.message,
      name: fields.name,
      email: fields.email,
      phone: fields.phone,
      brief: fields.brief,
    });
  } catch {
    /* Réseau injoignable : `archived` reste faux, et le navigateur en tire
       les conséquences. L'envoi Web3Forms, lui, est indépendant. */
  }

  /* `ok` dit « la demande est valide et a été traitée » ; `archived` dit
     « elle est écrite quelque part ». Les deux ne sont pas synonymes, et le
     navigateur a besoin du second pour savoir s'il peut annoncer un succès
     lorsque l'email Web3Forms, lui, n'est pas parti. */
  return json({ ok: true, archived });
};
