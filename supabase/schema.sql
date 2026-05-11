-- Inner Compass — Phase 2 schema
-- Run this in Supabase SQL editor for project bvctshqpfnedauytyzfo
-- before deploying Phase 2 to production.

-- profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  language_preference text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- assessment_sessions table
create table if not exists public.assessment_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  language text default 'en',
  status text default 'started',
  started_at timestamptz default now(),
  completed_at timestamptz,
  completion_time_seconds integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- responses table
create table if not exists public.responses (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.assessment_sessions(id) on delete cascade,
  item_id integer not null,
  answer jsonb not null,
  answered_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(session_id, item_id)
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.assessment_sessions enable row level security;
alter table public.responses enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can view own sessions"
  on public.assessment_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.assessment_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.assessment_sessions for update
  using (auth.uid() = user_id);

create policy "Users can view own responses"
  on public.responses for select
  using (
    auth.uid() in (
      select user_id from public.assessment_sessions
      where id = responses.session_id
    )
  );

create policy "Users can insert own responses"
  on public.responses for insert
  with check (
    auth.uid() in (
      select user_id from public.assessment_sessions
      where id = responses.session_id
    )
  );

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
