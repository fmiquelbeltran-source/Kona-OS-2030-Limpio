-- Ejecutar en SQL Editor de un proyecto Supabase que controles.
-- Una fila por usuario. NUNCA incluir datos de salud en el repositorio GitHub público.
create table if not exists public.athlete_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.athlete_state enable row level security;
revoke all on public.athlete_state from anon;
grant select, insert, update, delete on public.athlete_state to authenticated;
drop policy if exists "Athlete can read own state" on public.athlete_state;
create policy "Athlete can read own state" on public.athlete_state for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Athlete can insert own state" on public.athlete_state;
create policy "Athlete can insert own state" on public.athlete_state for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Athlete can update own state" on public.athlete_state;
create policy "Athlete can update own state" on public.athlete_state for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Athlete can delete own state" on public.athlete_state;
create policy "Athlete can delete own state" on public.athlete_state for delete to authenticated using (auth.uid() = user_id);
