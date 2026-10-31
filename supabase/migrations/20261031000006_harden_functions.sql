-- =====================================================================
-- Utwardzenie funkcji (zalecenia Supabase Security Advisor):
-- stały search_path i brak możliwości wywołania funkcji triggerów przez API.
-- =====================================================================

alter function public.touch_updated_at() set search_path = public;
alter function public.cascade_goal_soft_delete() set search_path = public;

revoke execute on function public.check_deposit_goal_owner() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.cascade_goal_soft_delete() from public, anon, authenticated;
revoke execute on function public.ensure_default_goal() from public, anon;
revoke execute on function public.set_default_goal(uuid) from public, anon;
grant execute on function public.ensure_default_goal() to authenticated;
grant execute on function public.set_default_goal(uuid) to authenticated;
