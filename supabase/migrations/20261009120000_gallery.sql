-- =============================================================================
-- Galería de fotos
--
-- Un álbum agrupa fotos de una fecha o evento. Puede ser de una serie (o de
-- toda la liga si series_id es null) y opcionalmente de un partido, para que
-- aparezca en la ficha de los dos equipos.
-- Las imágenes viven en el bucket public-images, carpeta gallery/<album_id>/.
-- =============================================================================

create table if not exists public.photo_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date date default current_date,
  series_id uuid references public.series(id) on delete set null,
  match_id uuid references public.matches(id) on delete set null,
  cover_url text,
  published boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists idx_photo_albums_series on public.photo_albums(series_id);
create index if not exists idx_photo_albums_match on public.photo_albums(match_id);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.photo_albums(id) on delete cascade,
  url text not null,
  caption text,
  display_order integer not null default 0,
  created_at timestamptz default now()
);
create index if not exists idx_photos_album on public.photos(album_id);

alter table public.photo_albums enable row level security;
alter table public.photos enable row level security;

-- El público ve solo álbumes publicados (y sus fotos); el staff ve y edita todo
create policy lectura_publicados on public.photo_albums for select
  using (published = true or (select public.is_staff()));
create policy staff_write on public.photo_albums for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy lectura_publicados on public.photos for select
  using (
    exists (
      select 1 from public.photo_albums a
      where a.id = album_id and (a.published = true or (select public.is_staff()))
    )
  );
create policy staff_write on public.photos for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Miniatura (480px) generada en el navegador al subir; la grilla usa esta y el
-- visor la original (2000px). Las imágenes no pasan por el optimizador de Vercel.
alter table public.photos add column if not exists thumb_url text;
