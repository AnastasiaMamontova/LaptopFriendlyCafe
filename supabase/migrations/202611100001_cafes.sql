-- This application intentionally has no accounts or roles. Anyone with the
-- application can read, add, edit, and delete cafes and their photos.
create table if not exists public.cafes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  district text not null check (char_length(btrim(district)) between 1 and 100),
  address text not null check (char_length(btrim(address)) between 1 and 500),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  description text not null default '',
  rating numeric(2,1) not null default 4.0 check (rating between 1.0 and 5.0),
  wifi boolean not null default true,
  sockets boolean not null default true,
  noise text not null default 'moderate' check (noise in ('quiet', 'moderate', 'lively')),
  laptop_friendly boolean not null default true,
  hours text not null default '',
  website text not null default '',
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.cafeapp_set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cafeapp_updated_at on public.cafes;
create trigger cafeapp_updated_at before update on public.cafes
for each row execute function public.cafeapp_set_updated_at();

alter table public.cafes enable row level security;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.cafes to anon, authenticated;
drop policy if exists cafeapp_public_access on public.cafes;
create policy cafeapp_public_access on public.cafes for all to anon, authenticated
using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cafe-photos', 'cafe-photos', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'])
on conflict (id) do update set public = excluded.public,
file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists cafeapp_public_photo_access on storage.objects;
create policy cafeapp_public_photo_access on storage.objects for all to anon, authenticated
using (bucket_id = 'cafe-photos') with check (bucket_id = 'cafe-photos');
