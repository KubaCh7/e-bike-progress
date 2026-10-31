-- =====================================================================
-- RODO: użytkownik może sam usunąć konto i wszystkie dane (art. 17).
-- Usunięcie z auth.users kaskadowo usuwa profiles, goals i deposits.
-- Pliki w Storage (zdjęcia) aplikacja usuwa wcześniej przez API Storage.
-- =====================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
begin
    if uid is null then
        raise exception 'not authenticated';
    end if;
    delete from public.deposits where user_id = uid;
    delete from public.goals where user_id = uid;
    delete from public.profiles where id = uid;
    delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
