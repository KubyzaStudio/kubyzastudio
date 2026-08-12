-- ============================================================================
-- KUBYZA STUDIO — AVIS CLIENTS
-- ============================================================================
-- À exécuter une fois dans Supabase : Dashboard > SQL Editor > New query.
-- Le script est idempotent : le relancer ne casse rien et ne crée pas de
-- doublon. Il ne touche à aucune autre table (`contact_requests` notamment).
--
-- MODÈLE DE CONFIANCE
-- ----------------------------------------------------------------------------
-- Le site est un export statique servi par le CDN Cloudflare. Il ne parle
-- JAMAIS à Supabase directement : tout passe par la Pages Function
-- `functions/api/reviews.ts`, qui s'exécute côté serveur et détient la clé.
--
-- Les règles ci-dessous ne sont donc pas la seule barrière — elles en sont la
-- dernière. Elles sont écrites comme si la clé anonyme était publique, parce
-- que c'est ce qu'elle est par nature : une clé anonyme volée ne doit ouvrir
-- aucune porte que ces règles n'autorisent explicitement.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. LA TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),

  name        text not null,
  city        text not null,
  rating      smallint not null,
  quote       text not null,

  -- Le seul état qui rende un avis public. Défaut volontairement 'pending' :
  -- une insertion qui « oublie » la colonne crée un avis en attente, jamais
  -- un avis publié. Le défaut est la position sûre.
  status      text not null default 'pending',

  -- Traçabilité de modération, à usage interne uniquement. Aucune de ces
  -- colonnes n'est lisible par le public (voir la vue de lecture plus bas).
  reviewed_at timestamptz,
  source_ip   text,

  constraint reviews_rating_range check (rating between 1 and 5),
  constraint reviews_status_valid check (status in ('pending', 'approved', 'rejected')),
  constraint reviews_name_length  check (char_length(name)  between 2 and 80),
  constraint reviews_city_length  check (char_length(city)  between 2 and 80),
  constraint reviews_quote_length check (char_length(quote) between 10 and 1200)
);

-- Si la table existait déjà sans ces colonnes, on les ajoute sans rien perdre.
alter table public.reviews add column if not exists reviewed_at timestamptz;
alter table public.reviews add column if not exists source_ip   text;

-- La lecture publique ne demande jamais que les avis approuvés, du plus
-- récent au plus ancien : l'index suit exactement cette requête.
create index if not exists reviews_approved_recent_idx
  on public.reviews (created_at desc)
  where status = 'approved';

-- ----------------------------------------------------------------------------
-- 2. HORODATAGE DE MODÉRATION
-- ----------------------------------------------------------------------------
-- `reviewed_at` se remplit tout seul au changement de statut : rien à penser
-- au moment de cliquer dans le Table Editor.
create or replace function public.reviews_touch_reviewed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status then
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_touch_reviewed_at on public.reviews;
create trigger reviews_touch_reviewed_at
  before update on public.reviews
  for each row execute function public.reviews_touch_reviewed_at();

-- ----------------------------------------------------------------------------
-- 3. RLS — CE QU'UN VISITEUR ANONYME PEUT FAIRE, ET RIEN DE PLUS
-- ----------------------------------------------------------------------------
alter table public.reviews enable row level security;

-- `force` inclut le propriétaire de la table dans le champ des règles :
-- sans cette ligne, une future fonction `security definer` contournerait
-- silencieusement tout ce qui suit.
alter table public.reviews force row level security;

drop policy if exists "anon lit les avis approuvés"   on public.reviews;
drop policy if exists "anon dépose un avis en attente" on public.reviews;

-- LECTURE : uniquement 'approved'. Un avis 'pending' ou 'rejected' n'existe
-- pas du point de vue du public — il n'est pas masqué, il est introuvable.
create policy "anon lit les avis approuvés"
  on public.reviews
  for select
  to anon
  using (status = 'approved');

-- ÉCRITURE : insertion seule, et le `with check` verrouille le statut. Un
-- client qui poste `{"status":"approved"}` se voit refuser la ligne par la
-- base elle-même — pas par la validation applicative, qui pourrait avoir un
-- trou, mais par Postgres.
create policy "anon dépose un avis en attente"
  on public.reviews
  for insert
  to anon
  with check (status = 'pending');

-- Aucune policy `update`, aucune policy `delete`, pour aucun rôle public.
-- En RLS, l'absence de règle vaut refus : modifier ou supprimer un avis est
-- impossible autrement qu'authentifié dans le tableau de bord Supabase.

-- ----------------------------------------------------------------------------
-- 4. LA FILE DE MODÉRATION
-- ----------------------------------------------------------------------------
-- Vue de confort pour le Table Editor : les avis à traiter, les plus anciens
-- en tête. Elle n'accorde aucun droit — elle hérite des règles ci-dessus.
create or replace view public.reviews_pending as
  select id, created_at, name, city, rating, quote
  from public.reviews
  where status = 'pending'
  order by created_at asc;

-- ============================================================================
-- MODÉRER, AU QUOTIDIEN
-- ----------------------------------------------------------------------------
-- Dashboard > Table Editor > reviews > colonne `status` : pending → approved
-- (l'avis apparaît sur le site en moins d'une minute) ou pending → rejected
-- (il n'apparaîtra jamais).
--
-- En SQL, si vous préférez :
--   update public.reviews set status = 'approved' where id = '…';
--   update public.reviews set status = 'rejected' where id = '…';
-- ============================================================================
