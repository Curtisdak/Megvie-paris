-- Supabase/Postgres schema for Louis Segond 1910 (LSG1910) with headings,
-- cross-references, and footnote support.
-- Import order: bible_books -> bible_chapters -> bible_verses -> bible_headings -> bible_cross_references -> bible_footnotes -> bible_introductions.

create table if not exists public.bible_books (
  id text primary key,
  book_number integer not null unique,
  testament text not null check (testament in ('OT', 'NT')),
  name text not null,
  name_english text,
  header text,
  chapter_count integer not null,
  verse_count integer not null
);

create table if not exists public.bible_chapters (
  id text primary key,
  book_id text not null references public.bible_books(id) on delete cascade,
  book_number integer not null,
  book_name text not null,
  testament text not null check (testament in ('OT', 'NT')),
  chapter integer not null,
  verse_count integer not null,
  unique (book_id, chapter)
);

create table if not exists public.bible_verses (
  id text primary key,
  translation_id text not null default 'lsg1910',
  book_id text not null references public.bible_books(id) on delete cascade,
  book_number integer not null,
  book_name text not null,
  testament text not null check (testament in ('OT', 'NT')),
  chapter integer not null,
  verse integer not null,
  reference text not null,
  text text not null,
  section_heading text,
  headings jsonb not null default '[]'::jsonb,
  cross_references jsonb not null default '[]'::jsonb,
  section_cross_references jsonb not null default '[]'::jsonb,
  footnotes jsonb not null default '[]'::jsonb,
  search_vector tsvector generated always as (
    to_tsvector('french', coalesce(text, '') || ' ' || coalesce(section_heading, ''))
  ) stored,
  unique (translation_id, book_id, chapter, verse)
);

create table if not exists public.bible_headings (
  id text primary key,
  translation_id text not null default 'lsg1910',
  book_id text not null references public.bible_books(id) on delete cascade,
  book_number integer not null,
  book_name text not null,
  testament text not null check (testament in ('OT', 'NT')),
  marker text not null,
  marker_level integer not null,
  scope text not null,
  text text not null,
  anchor_chapter integer,
  starts_at_chapter integer,
  starts_at_verse integer,
  starts_at_reference text,
  sort_order integer not null
);

create table if not exists public.bible_cross_references (
  id text primary key,
  translation_id text not null default 'lsg1910',
  kind text not null check (kind in ('inline', 'section', 'major_range')),
  marker text not null,
  book_id text not null references public.bible_books(id) on delete cascade,
  book_number integer not null,
  book_name text not null,
  testament text not null check (testament in ('OT', 'NT')),
  chapter_start integer,
  verse_start integer,
  chapter_end integer,
  verse_end integer,
  source_reference text,
  caller text,
  origin_text text,
  target_text text not null,
  raw text,
  sort_order integer not null
);

create table if not exists public.bible_footnotes (
  id text primary key,
  translation_id text not null default 'lsg1910',
  book_id text not null references public.bible_books(id) on delete cascade,
  book_number integer not null,
  book_name text not null,
  testament text not null check (testament in ('OT', 'NT')),
  chapter integer,
  verse integer,
  reference text,
  caller text,
  origin_text text,
  text text not null,
  fields jsonb not null default '{}'::jsonb,
  raw text,
  sort_order integer not null
);

create table if not exists public.bible_introductions (
  id text primary key,
  translation_id text not null default 'lsg1910',
  book_id text not null references public.bible_books(id) on delete cascade,
  book_number integer not null,
  book_name text not null,
  testament text not null check (testament in ('OT', 'NT')),
  marker text not null,
  text text not null,
  anchor_chapter integer,
  sort_order integer not null
);

create index if not exists bible_verses_book_chapter_verse_idx on public.bible_verses (book_id, chapter, verse);
create index if not exists bible_verses_book_number_idx on public.bible_verses (book_number, chapter, verse);
create index if not exists bible_verses_search_idx on public.bible_verses using gin (search_vector);
create index if not exists bible_headings_location_idx on public.bible_headings (book_number, starts_at_chapter, starts_at_verse, sort_order);
create index if not exists bible_cross_refs_location_idx on public.bible_cross_references (book_number, chapter_start, verse_start, sort_order);
create index if not exists bible_cross_refs_kind_idx on public.bible_cross_references (kind);
create index if not exists bible_cross_refs_target_search_idx on public.bible_cross_references using gin (to_tsvector('simple', coalesce(target_text, '')));

-- Reference lookup with embedded headings and cross references:
-- select reference, section_heading, text, headings, cross_references, section_cross_references, footnotes
-- from public.bible_verses
-- where book_id = 'JHN' and chapter = 3 and verse = 16;

-- French full-text search:
-- select reference, section_heading, text
-- from public.bible_verses
-- where search_vector @@ plainto_tsquery('french', 'vie éternelle')
-- order by book_number, chapter, verse
-- limit 50;
