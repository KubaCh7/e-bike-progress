-- =====================================================================
-- Zdjęcia w katalogu e-bike'ów (wolne licencje, z podpisem autora)
-- =====================================================================

alter table public.bike_catalog add column if not exists image_url text;
alter table public.bike_catalog add column if not exists image_credit text;
alter table public.bike_catalog add column if not exists image_source text;
