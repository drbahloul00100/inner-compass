-- Inner Compass — Phase 3 scoring schema
-- Run this in the Supabase SQL editor for project bvctshqpfnedauytyzfo
-- BEFORE deploying the Phase 3 code changes.
--
-- scoring_results stores the deterministic engine output keyed by session_id.
-- Per Phase 3 spec the RLS is intentionally permissive (anyone with a valid
-- session_id can read/write). session_id is high-entropy UUID so this is safe
-- for the Phase 3 placeholder. Tighten in Phase 4 when reports are gated
-- behind purchase / user_id.

create table if not exists public.scoring_results (
  id              uuid primary key default gen_random_uuid(),
  session_id      text not null unique,
  engine_version  text not null default 'inner_compass_scoring_v1.1',
  scoring_json    jsonb not null,
  primary_signature text,
  primary_driver    text,
  primary_pattern   text,
  validity_confidence text,
  scored_at       timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists scoring_results_session_id_idx
  on public.scoring_results (session_id);

alter table public.scoring_results enable row level security;

-- Policy: anyone (anon + authenticated) can insert scoring results.
-- Intentional Phase 3 looseness — tighten when payment/report-access lands.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'scoring_results'
      and policyname = 'Anyone can insert scoring results'
  ) then
    create policy "Anyone can insert scoring results"
      on public.scoring_results for insert
      with check (true);
  end if;
end$$;

-- Policy: anyone can read by session_id (intentional Phase 3 looseness).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'scoring_results'
      and policyname = 'Anyone can view scoring results by session'
  ) then
    create policy "Anyone can view scoring results by session"
      on public.scoring_results for select
      using (true);
  end if;
end$$;

-- Policy: anyone can update (for re-scoring idempotency).
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'scoring_results'
      and policyname = 'Anyone can update scoring results'
  ) then
    create policy "Anyone can update scoring results"
      on public.scoring_results for update
      using (true)
      with check (true);
  end if;
end$$;
