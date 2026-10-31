-- =====================================================================
-- Domyślny cel "e-ride pro SR" (30 000 zł) dla każdego nowego konta
-- oraz funkcje pomocnicze wywoływane z klientów.
-- =====================================================================

-- Tworzy cel SR, jeśli użytkownik jeszcze go nie ma (idempotentne).
create or replace function public.ensure_default_goal()
returns setof public.goals
language plpgsql
security invoker
set search_path = public
as $$
declare
    uid uuid := auth.uid();
begin
    if uid is null then
        raise exception 'not authenticated';
    end if;

    insert into public.goals (user_id, name, target_amount, photo_url, is_default, seed_key)
    select uid, 'e-ride pro SR', 30000, 'asset:ride_pro_sr_placeholder',
           not exists (select 1 from public.goals where user_id = uid and is_default and deleted_at is null),
           'ride_pro_sr'
     where not exists (select 1 from public.goals where user_id = uid and seed_key = 'ride_pro_sr');

    return query select * from public.goals where user_id = uid and deleted_at is null order by created_at;
end;
$$;

grant execute on function public.ensure_default_goal() to authenticated;

-- Ustawia wskazany cel jako główny (pozostałe tracą flagę) – atomowo.
create or replace function public.set_default_goal(p_goal_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
    update public.goals
       set is_default = false
     where user_id = auth.uid() and is_default and id <> p_goal_id;

    update public.goals
       set is_default = true
     where user_id = auth.uid() and id = p_goal_id and deleted_at is null;
end;
$$;

grant execute on function public.set_default_goal(uuid) to authenticated;

-- Trigger na auth.users: nowe konto od razu dostaje cel SR.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.goals (user_id, name, target_amount, photo_url, is_default, seed_key)
    values (new.id, 'e-ride pro SR', 30000, 'asset:ride_pro_sr_placeholder', true, 'ride_pro_sr')
    on conflict do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
