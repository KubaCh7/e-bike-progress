# Supabase

Migracje uruchamiaj w kolejności nazw plików:

1. `20261031000001_init_schema.sql` – tabele `goals`, `deposits`, triggery
2. `20261031000002_rls_policies.sql` – Row Level Security
3. `20261031000003_default_goal_and_rpc.sql` – cel „e-ride pro SR” dla nowych kont, RPC
4. `20261031000004_storage.sql` – bucket `goal-photos` i polityki Storage

Najprościej: Dashboard → **SQL Editor** → wklej zawartość każdego pliku → **Run**.
Albo Supabase CLI: `supabase link --project-ref <ref>` i `supabase db push`.
5. `20261031000005_realtime.sql` – Realtime
6. `20261031000006_harden_functions.sql` – utwardzenie funkcji (Security Advisor)
