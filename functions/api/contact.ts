/**
 * POST /api/contact — réception des demandes de mission.
 *
 * Cloudflare Pages Function : le site reste 100 % statique, seule cette route
 * s'exécute côté serveur. Elle ne dépend d'aucun paquet npm.
 *
 * Variables d'environnement (Pages > Settings > Environment variables) :
 *   RESEND_API_KEY            obligatoire pour l'envoi d'email
 *   CONTACT_FROM_EMAIL        expéditeur vérifié dans Resend
 *   CONTACT_TO_EMAIL          destinataire des demandes
 *   SUPABASE_URL              facultatif — archivage des demandes
 *   SUPABASE_SERVICE_ROLE_KEY facultatif
 *
 * Binding facultatif :
 *   CONTACT_RATE_LIMIT        namespace KV pour la limitation par IP
 */

interface Env {
  RESEND_API_KEY?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_TO_EMAIL?: string;
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

/** Neutralise le HTML avant insertion dans un email. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Empêche l'injection d'en-têtes via le nom affiché de l'expéditeur. */
function safeHeaderValue(value: string): string {
  return value.replace(/[\r\n<>]/g, " ").trim();
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
 * L'ENVOI PASSE PAR RESEND, ET PAR LUI SEUL
 * ==========================================================================
 * Un relais Web3Forms a été branché ici, puis retiré après essai. Le motif
 * mérite d'être noté, parce qu'il n'est écrit nulle part dans leur
 * documentation d'accueil et qu'il coûterait la même demi-heure à qui
 * retenterait :
 *
 *   HTTP 403 — "This method is not allowed. Use our API in client side or
 *   contact support with server IP address (Pro plan is required)"
 *
 * Web3Forms refuse les appels serveur sur le plan gratuit. Leur API est
 * prévue pour être appelée depuis le navigateur, et c'est là qu'elle est
 * désormais appelée — voir le repli dans `src/components/sections/
 * ContactForm.tsx`, qui ne se déclenche que si cette route répond
 * `delivery_unavailable`.
 *
 * Cette fonction reste donc le chemin préféré et le restera : Resend envoie
 * depuis votre propre domaine, l'accusé de réception part sous l'identité du
 * studio, et rien ne transite par un tiers. Le jour où `RESEND_API_KEY` et
 * `CONTACT_FROM_EMAIL` sont renseignés, le repli navigateur cesse de lui
 * seul d'être atteint — il n'y a rien à retirer.
 */
async function sendEmail(
  env: Env,
  message: {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
  },
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.CONTACT_FROM_EMAIL) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
  });

  return response.ok;
}

async function archive(env: Env, record: Record<string, string>): Promise<void> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return;

  await fetch(`${env.SUPABASE_URL}/rest/v1/contact_requests`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(record),
  });
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

  const rows: Array<[string, string]> = [
    ["Métier", fields.activity],
    ["Entreprise", fields.company],
    ["Type de projet", fields.projectType],
    ["Objectif", fields.goal],
    ["Budget", fields.budget],
    ["Configuration", fields.brief],
    ["Nom", fields.name],
    ["Email", fields.email],
    ["Téléphone", fields.phone],
  ].filter(([, value]) => value.length > 0) as Array<[string, string]>;

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#8a94ad;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(
          label,
        )}</td><td style="padding:6px 0;color:#0b1020;font-size:14px">${escapeHtml(
          value,
        )}</td></tr>`,
    )
    .join("");

  const messageBlock = fields.message
    ? `<p style="margin:24px 0 0;padding:16px;background:#f4f6fb;border-radius:10px;color:#0b1020;font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(
        fields.message,
      )}</p>`
    : "";

  const notification = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:600px">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#3d6bff">Nouvelle mission</p>
      <h1 style="margin:0 0 24px;font-size:22px;color:#0b1020">${escapeHtml(
        fields.activity,
      )}${fields.company ? ` — ${escapeHtml(fields.company)}` : ""}</h1>
      <table style="border-collapse:collapse;width:100%">${tableRows}</table>
      ${messageBlock}
    </div>
  `;

  const confirmation = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:600px">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#3d6bff">Kubyza Studio</p>
      <h1 style="margin:0 0 16px;font-size:22px;color:#0b1020">Votre demande est bien arrivée.</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#3a4358">
        Merci${fields.name ? ` ${escapeHtml(fields.name)}` : ""}. Nous revenons vers vous
        sous 24 heures avec une première proposition : ce que nous ferions, en combien
        de temps, et pour quel montant.
      </p>
      <p style="margin:0;font-size:14px;line-height:1.65;color:#8a94ad">
        À très vite,<br />Kubyza Studio — Nous lançons votre présence en ligne.
      </p>
    </div>
  `;

  const to = env.CONTACT_TO_EMAIL ?? env.CONTACT_FROM_EMAIL;
  let delivered = false;

  if (to) {
    delivered = await sendEmail(env, {
      to,
      subject: `Mission · ${safeHeaderValue(fields.activity)}${
        fields.company ? ` — ${safeHeaderValue(fields.company)}` : ""
      }`,
      html: notification,
      replyTo: fields.email || undefined,
    });
  }

  // L'accusé de réception ne doit jamais faire échouer la demande.
  if (fields.email) {
    try {
      await sendEmail(env, {
        to: fields.email,
        subject: "Votre demande est bien arrivée — Kubyza Studio",
        html: confirmation,
      });
    } catch {
      /* silencieux */
    }
  }

  try {
    await archive(env, {
      ...fields,
      created_at: new Date().toISOString(),
    });
  } catch {
    /* silencieux */
  }

  // Sans clé Resend configurée, on refuse explicitement : le visiteur voit
  // le repli « écrivez-nous directement » plutôt qu'un faux succès.
  if (!delivered) {
    return json({ error: "delivery_unavailable" }, 502);
  }

  return json({ ok: true });
};
