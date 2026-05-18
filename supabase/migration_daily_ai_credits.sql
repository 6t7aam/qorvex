alter table public.generations
  add column if not exists provider text not null default 'anthropic',
  add column if not exists prompt_tokens integer,
  add column if not exists completion_tokens integer,
  add column if not exists estimated_cost_usd numeric(12, 6);

create table if not exists public.daily_ai_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  usage_date date not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  estimated_cost_usd numeric(12, 6) not null default 0,
  credits_used integer not null default 0,
  request_count integer not null default 0,
  active_requests integer not null default 0,
  last_request_at timestamptz,
  last_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, usage_date)
);

create index if not exists idx_daily_ai_usage_user_id
  on public.daily_ai_usage(user_id);

create index if not exists idx_daily_ai_usage_usage_date
  on public.daily_ai_usage(usage_date);

alter table public.daily_ai_usage enable row level security;

drop policy if exists "Users can view own daily ai usage" on public.daily_ai_usage;
create policy "Users can view own daily ai usage"
  on public.daily_ai_usage for select
  using (auth.uid() = user_id);
