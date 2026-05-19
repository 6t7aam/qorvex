-- =========================================================================
-- Qorvex - fixed initial app generation credit charge tracking
-- =========================================================================

create extension if not exists "uuid-ossp";

create table if not exists public.credit_usage_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  event_type text not null,
  amount integer not null check (amount > 0),
  request_id text,
  project_id uuid references public.projects(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, event_type, request_id)
);

create index if not exists idx_credit_usage_events_user_id
  on public.credit_usage_events(user_id);

create index if not exists idx_credit_usage_events_project_id
  on public.credit_usage_events(project_id);

create index if not exists idx_credit_usage_events_event_type
  on public.credit_usage_events(event_type);

alter table public.credit_usage_events enable row level security;

drop policy if exists "Users can view own credit usage events"
  on public.credit_usage_events;

create policy "Users can view own credit usage events"
  on public.credit_usage_events for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies are intentionally defined here.
-- Credit usage events are written only by server-side service-role code.
