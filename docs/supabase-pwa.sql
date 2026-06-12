-- MegVie Paris PWA push notification schema.
-- Run this in the Supabase SQL editor, then replace the seed verses with the
-- full church-approved 365/366 day list.

create extension if not exists pgcrypto;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  locale text,
  timezone text default 'Europe/Paris',
  is_active boolean default true,
  last_sent_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.daily_bible_verses (
  id uuid primary key default gen_random_uuid(),
  day_of_year integer unique not null check (
    day_of_year between 1 and 366
  ),
  reference text not null,
  text text not null,
  translation text default 'Louis Segond 1910',
  theme text,
  created_at timestamptz default now()
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.push_subscriptions(id) on delete set null,
  verse_id uuid references public.daily_bible_verses(id) on delete set null,
  status text not null,
  error_message text,
  sent_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_push_subscriptions_updated_at
on public.push_subscriptions;

create trigger set_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row
execute function public.set_updated_at();

alter table public.push_subscriptions enable row level security;
alter table public.daily_bible_verses enable row level security;
alter table public.notification_logs enable row level security;

-- No public RLS policies are added for push_subscriptions.
-- The app writes subscriptions through protected Next.js API routes with the
-- server-only Supabase service-role key.

insert into public.daily_bible_verses
  (day_of_year, reference, text, translation, theme)
values
  (
    1,
    'Psaume 118:24',
    'C''est ici la journee que l''Eternel a faite: qu''elle soit pour nous un sujet d''allegresse et de joie.',
    'Louis Segond 1910',
    'Joie'
  ),
  (
    2,
    'Jean 14:27',
    'Je vous laisse la paix, je vous donne ma paix.',
    'Louis Segond 1910',
    'Paix'
  ),
  (
    3,
    'Philippiens 4:13',
    'Je puis tout par celui qui me fortifie.',
    'Louis Segond 1910',
    'Force'
  ),
  (
    4,
    'Psaume 23:1',
    'L''Eternel est mon berger: je ne manquerai de rien.',
    'Louis Segond 1910',
    'Confiance'
  ),
  (
    5,
    'Romains 8:31',
    'Si Dieu est pour nous, qui sera contre nous?',
    'Louis Segond 1910',
    'Assurance'
  ),
  (
    6,
    'Esaie 41:10',
    'Ne crains rien, car je suis avec toi.',
    'Louis Segond 1910',
    'Courage'
  ),
  (
    7,
    'Matthieu 5:14',
    'Vous etes la lumiere du monde.',
    'Louis Segond 1910',
    'Temoignage'
  )
on conflict (day_of_year) do update set
  reference = excluded.reference,
  text = excluded.text,
  translation = excluded.translation,
  theme = excluded.theme;
