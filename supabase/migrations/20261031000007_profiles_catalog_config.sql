-- =====================================================================
-- Profile (imię), katalog e-bike'ów, konfiguracja aplikacji (aktualizacje)
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles: imię wyświetlane i informacja, czy użytkownik przeszedł onboarding
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
    id           uuid primary key references auth.users (id) on delete cascade,
    display_name text check (display_name is null or char_length(display_name) <= 60),
    onboarded    boolean not null default false,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
    before insert or update on public.profiles
    for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
    for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
    for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
    for update to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

-- istniejące konta dostają profil (imię z metadanych rejestracji, jeśli jest)
insert into public.profiles (id, display_name)
select id, nullif(trim(raw_user_meta_data ->> 'display_name'), '')
  from auth.users
on conflict (id) do nothing;

-- Nowe konto: tylko profil z imieniem. Cele użytkownik wybiera w onboardingu
-- (e-ride pro SR jest tam zaznaczony domyślnie jako cel główny).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, display_name)
    values (new.id, nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''))
    on conflict (id) do nothing;
    return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- goals.catalog_id: z jakiego modelu katalogu powstał cel
-- ---------------------------------------------------------------------
alter table public.goals add column if not exists catalog_id text;
update public.goals set catalog_id = 'eride-pro-sr' where seed_key = 'ride_pro_sr' and catalog_id is null;

-- ---------------------------------------------------------------------
-- bike_catalog: popularne e-bike'i do wyboru (publiczny odczyt).
-- Nowe modele dodane tutaj pojawiają się w aplikacjach bez aktualizacji.
-- ---------------------------------------------------------------------
create table if not exists public.bike_catalog (
    id         text primary key,
    brand      text not null,
    model      text not null,
    category   text not null check (category in ('moto', 'emtb', 'city')),
    price      numeric(12, 2) not null check (price > 0),
    color      text not null default '#14b8a6',
    featured   boolean not null default false,
    sort       integer not null default 1000,
    active     boolean not null default true,
    updated_at timestamptz not null default now()
);

drop trigger if exists bike_catalog_touch on public.bike_catalog;
create trigger bike_catalog_touch
    before insert or update on public.bike_catalog
    for each row execute function public.touch_updated_at();

alter table public.bike_catalog enable row level security;

drop policy if exists "bike_catalog_read" on public.bike_catalog;
create policy "bike_catalog_read" on public.bike_catalog
    for select to anon, authenticated using (active);

revoke all on public.bike_catalog from anon, authenticated;
grant select on public.bike_catalog to anon, authenticated;

-- ---------------------------------------------------------------------
-- app_config: m.in. najnowsza wersja aplikacji iOS (baner "Aktualizacja")
-- ---------------------------------------------------------------------
create table if not exists public.app_config (
    key        text primary key,
    value      jsonb not null,
    updated_at timestamptz not null default now()
);

drop trigger if exists app_config_touch on public.app_config;
create trigger app_config_touch
    before insert or update on public.app_config
    for each row execute function public.touch_updated_at();

alter table public.app_config enable row level security;

drop policy if exists "app_config_read" on public.app_config;
create policy "app_config_read" on public.app_config
    for select to anon, authenticated using (true);

revoke all on public.app_config from anon, authenticated;
grant select on public.app_config to anon, authenticated;

insert into public.app_config (key, value) values
    ('ios_update', jsonb_build_object(
        'latest_build', 1,
        'min_build', 1,
        'url', null,
        'notes_pl', 'Nowa wersja aplikacji jest gotowa.',
        'notes_en', 'A new version of the app is ready.'
    ))
on conflict (key) do nothing;
