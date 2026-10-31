-- =====================================================================
-- Realtime: wersja web od razu widzi zmiany zrobione na iPhonie.
-- RLS obowiązuje także dla Realtime – każdy dostaje tylko swoje wiersze.
-- =====================================================================

do $$
begin
    if not exists (
        select 1 from pg_publication_tables
         where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'goals'
    ) then
        alter publication supabase_realtime add table public.goals;
    end if;
    if not exists (
        select 1 from pg_publication_tables
         where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'deposits'
    ) then
        alter publication supabase_realtime add table public.deposits;
    end if;
end;
$$;
