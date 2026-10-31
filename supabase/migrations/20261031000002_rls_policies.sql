-- =====================================================================
-- Row Level Security – każdy użytkownik widzi i zmienia tylko swoje dane
-- =====================================================================

alter table public.goals    enable row level security;
alter table public.deposits enable row level security;

-- goals ---------------------------------------------------------------
drop policy if exists "goals_select_own" on public.goals;
create policy "goals_select_own" on public.goals
    for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "goals_insert_own" on public.goals;
create policy "goals_insert_own" on public.goals
    for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "goals_update_own" on public.goals;
create policy "goals_update_own" on public.goals
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "goals_delete_own" on public.goals;
create policy "goals_delete_own" on public.goals
    for delete to authenticated
    using ((select auth.uid()) = user_id);

-- deposits ------------------------------------------------------------
drop policy if exists "deposits_select_own" on public.deposits;
create policy "deposits_select_own" on public.deposits
    for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "deposits_insert_own" on public.deposits;
create policy "deposits_insert_own" on public.deposits
    for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "deposits_update_own" on public.deposits;
create policy "deposits_update_own" on public.deposits
    for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "deposits_delete_own" on public.deposits;
create policy "deposits_delete_own" on public.deposits
    for delete to authenticated
    using ((select auth.uid()) = user_id);

-- anon nie ma żadnego dostępu
revoke all on public.goals    from anon;
revoke all on public.deposits from anon;
grant select, insert, update, delete on public.goals    to authenticated;
grant select, insert, update, delete on public.deposits to authenticated;
