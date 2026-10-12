-- Aeternium · esquema inicial
-- Postgres (Supabase). Lectura pública; escritura solo service role (las API
-- mutadoras van protegidas por login de admin y usan la service role key).

create extension if not exists "pgcrypto";

-- Personajes de la galería
create table if not exists public.characters (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    image_path  text not null,          -- ruta dentro del bucket characters
    created_at  timestamptz not null default now()
);

-- Mapas del atlas
create table if not exists public.maps (
    id          uuid primary key default gen_random_uuid(),
    slug        text not null unique,
    name        text not null,
    image_path  text not null,          -- ruta dentro del bucket maps
    width       integer not null,
    height      integer not null,
    created_at  timestamptz not null default now()
);

-- Marcadores sobre un mapa (coordenadas CRS.Simple: x=col, y=fila)
create table if not exists public.markers (
    id          uuid primary key default gen_random_uuid(),
    map_id      uuid not null references public.maps(id) on delete cascade,
    x           double precision not null,
    y           double precision not null,
    label       text not null default '',
    icon        text not null default 'city',  -- city | point
    tooltip     text,
    created_at  timestamptz not null default now()
);

-- Rutas / líneas sobre un mapa
create table if not exists public.lines (
    id          uuid primary key default gen_random_uuid(),
    map_id      uuid not null references public.maps(id) on delete cascade,
    x1          double precision not null,
    y1          double precision not null,
    x2          double precision not null,
    y2          double precision not null,
    color       text not null default '#000000',
    weight      integer not null default 3,
    opacity     double precision not null default 1.0,
    created_at  timestamptz not null default now()
);

create index if not exists markers_map_id_idx on public.markers(map_id);
create index if not exists lines_map_id_idx on public.lines(map_id);

-- RLS: lectura pública, sin escritura desde el cliente.
alter table public.characters enable row level security;
alter table public.maps       enable row level security;
alter table public.markers    enable row level security;
alter table public.lines      enable row level security;

drop policy if exists "characters_public_read" on public.characters;
drop policy if exists "maps_public_read"       on public.maps;
drop policy if exists "markers_public_read"    on public.markers;
drop policy if exists "lines_public_read"      on public.lines;

create policy "characters_public_read" on public.characters for select using (true);
create policy "maps_public_read"       on public.maps       for select using (true);
create policy "markers_public_read"    on public.markers    for select using (true);
create policy "lines_public_read"      on public.lines      for select using (true);

-- Buckets de Storage (lectura pública). Ejecutar una vez; ignora si existen.
insert into storage.buckets (id, name, public)
values ('characters', 'characters', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('maps', 'maps', true)
on conflict (id) do nothing;
