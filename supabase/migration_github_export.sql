-- =========================================================================
-- Qorvex — GitHub OAuth + export support
-- =========================================================================
-- Adds secure server-side GitHub connection metadata and optional export
-- metadata tracking. The app routes are compatible with the pre-migration
-- github_connections table, but apply this before production rollout so the
-- token is no longer exposed through direct SELECT policies.
-- =========================================================================

create extension if not exists "uuid-ossp";

alter table public.github_connections
  add column if not exists github_user_id bigint,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.github_exports (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  repo_full_name text not null,
  repo_url text not null,
  branch text not null default 'main',
  commit_sha text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_github_exports_project_id
  on public.github_exports(project_id);

create index if not exists idx_github_exports_user_id
  on public.github_exports(user_id);

alter table public.github_connections enable row level security;
alter table public.github_exports enable row level security;

drop policy if exists "Users can view own github connection" on public.github_connections;
drop policy if exists "Users can manage own github connection" on public.github_connections;
drop policy if exists "Users can create own github connection" on public.github_connections;
drop policy if exists "Users can update own github connection" on public.github_connections;
drop policy if exists "Users can delete own github connection" on public.github_connections;

create policy "Users can create own github connection"
  on public.github_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own github connection"
  on public.github_connections for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own github connection"
  on public.github_connections for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can view own github exports" on public.github_exports;
create policy "Users can view own github exports"
  on public.github_exports for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own github exports" on public.github_exports;
create policy "Users can create own github exports"
  on public.github_exports for insert
  with check (auth.uid() = user_id);
