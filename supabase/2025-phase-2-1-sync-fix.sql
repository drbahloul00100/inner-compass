-- Inner Compass — Phase 2.1 sync-fix migration
-- Run this in the Supabase SQL editor for project bvctshqpfnedauytyzfo
-- BEFORE deploying the Phase 2.1 code changes.
--
-- Three additions, all idempotent:
--   1. assessment_sessions.email_captured column (captured at magic-link submit)
--   2. profiles INSERT policy (lets the client defensively upsert its own
--      profile row if the handle_new_user trigger ever fails to fire)
--   3. responses UPDATE policy (lets upsert re-sync existing answers without
--      silently failing)

-- 1) email_captured column on assessment_sessions
alter table public.assessment_sessions
  add column if not exists email_captured text;

-- 2) profiles INSERT policy — gated on auth.uid() = id so users can only
-- create their OWN profile row. The handle_new_user trigger continues to be
-- the primary mechanism; this policy is a safety net.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
      on public.profiles for insert
      with check (auth.uid() = id);
  end if;
end$$;

-- 3) responses UPDATE policy — required for upsert with conflict resolution.
-- Without this, re-running the sync would silently fail to update any
-- response row that already exists, leaving the session out of sync.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'responses'
      and policyname = 'Users can update own responses'
  ) then
    create policy "Users can update own responses"
      on public.responses for update
      using (
        auth.uid() in (
          select user_id from public.assessment_sessions
          where id = responses.session_id
        )
      );
  end if;
end$$;
