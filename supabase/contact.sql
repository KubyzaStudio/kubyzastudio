-- Kubyza Studio — demandes de contact
-- À exécuter une fois dans Supabase > SQL Editor.

create table if not exists public.contact_requests (
  id            bigserial primary key,
  created_at    timestamptz not null default now(),
  activity      text,
  company       text,
  project_type  text,
  goal          text,
  budget        text,
  message       text,
  name          text,
  email         text,
  phone         text,
  brief         text
);

-- Les visiteurs n'ont pas besoin d'accéder directement à cette table :
-- l'écriture est faite exclusivement par la Pages Function avec la clé de service.
alter table public.contact_requests enable row level security;
