-- Table quality is a separate fact, not an alias for laptop permission.
-- Existing cafes need an explicit confirmation before matching this filter.
alter table public.cafes
  add column if not exists good_tables boolean not null default false;

comment on column public.cafes.good_tables is
  'Comfortable tables suitable for working. Confirmed explicitly in the cafe editor.';

-- Keep the legacy laptop_friendly column for already installed app versions.
-- No existing records, photos, or legacy values are removed or reclassified.
notify pgrst, 'reload schema';
