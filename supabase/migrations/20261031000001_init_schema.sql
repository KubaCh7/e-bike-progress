-- =====================================================================
-- e-bike progress – schemat bazy
-- Tabele: goals (cele), deposits (wpłaty)
-- Usuwanie jest "miękkie" (deleted_at), żeby klienci offline (iPhone)
-- mogli się dowiedzieć o usuniętych rekordach podczas synchronizacji.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------
create table if not exists public.goals (
    id            uuid primary key default gen_random_uuid(),
    user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
    name          text not null check (char_length(name) between 1 and 120),
    target_amount numeric(12, 2) not null check (target_amount > 0),
    -- ścieżka w Storage ("<user_id>/<goal_id>.jpg") albo "asset:ride_pro_sr_placeholder"
    photo_url     text,
    is_default    boolean not null default false,
    -- znacznik celu tworzonego automatycznie (np. 'ride_pro_sr'); chroni przed duplikatami
    seed_key      text,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    deleted_at    timestamptz
);

create index if not exists goals_user_updated_idx on public.goals (user_id, updated_at);
create unique index if not exists goals_user_seed_key_uidx
    on public.goals (user_id, seed_key)
    where seed_key is not null;

-- ---------------------------------------------------------------------
-- deposits
-- ---------------------------------------------------------------------
create table if not exists public.deposits (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
    goal_id      uuid not null references public.goals (id) on delete cascade,
    amount       numeric(12, 2) not null check (amount > 0),
    deposit_date date not null default current_date,
    note         text check (note is null or char_length(note) <= 500),
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now(),
    deleted_at   timestamptz
);

create index if not exists deposits_user_updated_idx on public.deposits (user_id, updated_at);
create index if not exists deposits_goal_date_idx on public.deposits (goal_id, deposit_date desc);

-- ---------------------------------------------------------------------
-- updated_at ustawiany zawsze przez serwer (podstawa synchronizacji przyrostowej)
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := clock_timestamp();
    return new;
end;
$$;

drop trigger if exists goals_touch on public.goals;
create trigger goals_touch
    before insert or update on public.goals
    for each row execute function public.touch_updated_at();

drop trigger if exists deposits_touch on public.deposits;
create trigger deposits_touch
    before insert or update on public.deposits
    for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Miękkie usunięcie celu usuwa też jego wpłaty
-- ---------------------------------------------------------------------
create or replace function public.cascade_goal_soft_delete()
returns trigger
language plpgsql
as $$
begin
    if new.deleted_at is not null and old.deleted_at is null then
        update public.deposits
           set deleted_at = new.deleted_at
         where goal_id = new.id
           and deleted_at is null;
    end if;
    return new;
end;
$$;

drop trigger if exists goals_soft_delete_cascade on public.goals;
create trigger goals_soft_delete_cascade
    after update of deleted_at on public.goals
    for each row execute function public.cascade_goal_soft_delete();

-- ---------------------------------------------------------------------
-- Wpłata musi należeć do celu tego samego użytkownika
-- ---------------------------------------------------------------------
create or replace function public.check_deposit_goal_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if not exists (
        select 1 from public.goals g
         where g.id = new.goal_id and g.user_id = new.user_id
    ) then
        raise exception 'goal % does not belong to user', new.goal_id;
    end if;
    return new;
end;
$$;

drop trigger if exists deposits_owner_check on public.deposits;
create trigger deposits_owner_check
    before insert or update of goal_id, user_id on public.deposits
    for each row execute function public.check_deposit_goal_owner();
