-- =====================================================================
-- 1) Usunięty cel nie blokuje ponownego dodania tego samego modelu
--    (unikalny seed_key tylko wśród nieusuniętych celów).
-- 2) Ranking popularności w katalogu (najpopularniejsze na górze).
-- =====================================================================

drop index if exists public.goals_user_seed_key_uidx;
create unique index goals_user_seed_key_uidx
    on public.goals (user_id, seed_key)
    where seed_key is not null and deleted_at is null;

alter table public.bike_catalog add column if not exists popularity integer not null default 100;
