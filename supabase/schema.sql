-- =========================================================================
-- Qorvex — Full database schema
-- =========================================================================
-- Manual setup steps (do these in the Supabase dashboard BEFORE running this):
--   1. Create a new project at https://supabase.com named "qorvex".
--   2. Wait for it to finish provisioning.
--   3. Project Settings > API — copy into .env.local:
--        Project URL         -> NEXT_PUBLIC_SUPABASE_URL
--        anon public key     -> NEXT_PUBLIC_SUPABASE_ANON_KEY
--        service_role key    -> SUPABASE_SERVICE_ROLE_KEY
--   4. Authentication > Providers — enable Google OAuth.
--   5. In the Google OAuth provider settings add this callback URL:
--        https://[your-project-ref].supabase.co/auth/v1/callback
--   6. Open the SQL editor and run this whole file.
--   7. Then run supabase/seed.sql to insert the starter templates.
-- =========================================================================

create extension if not exists "uuid-ossp";

-- =========================================================================
-- Tables
-- =========================================================================

create table if not exists public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'max')),
  generations_used_this_week integer not null default 0,
  week_reset_at timestamptz not null default date_trunc('week', now()),
  preferred_language text not null default 'en',
  ip_hash text,
  abuse_detected boolean not null default false,
  stripe_customer_id text,
  subscription_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_status text;

create table if not exists public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  name text not null,
  description text,
  prompt text not null,
  status text not null default 'generating' check (status in ('generating', 'ready', 'error', 'deployed')),
  template_id text,
  app_type text not null default 'custom',
  colors jsonb not null default '{"primary":"#7c3aed","secondary":"#06b6d4","accent":"#f59e0b"}'::jsonb,
  features text[] not null default '{}',
  generated_code jsonb,
  preview_url text,
  github_repo text,
  expo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  prompt text not null,
  provider text not null default 'anthropic',
  model text not null default 'claude-sonnet-4-5',
  prompt_tokens integer,
  completion_tokens integer,
  tokens_used integer,
  estimated_cost_usd numeric(12, 6),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

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

create table if not exists public.referral_codes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid default uuid_generate_v4() primary key,
  referrer_user_id uuid references auth.users(id) on delete cascade not null,
  referred_user_id uuid references auth.users(id) on delete cascade not null unique,
  referral_code text not null,
  status text not null default 'signed_up' check (status in ('signed_up', 'upgraded', 'rewarded')),
  referred_plan text check (referred_plan in ('pro', 'max')),
  signup_bonus_granted boolean not null default false,
  reward_credits integer not null default 0,
  created_at timestamptz not null default now(),
  upgraded_at timestamptz,
  reward_granted_at timestamptz
);

create table if not exists public.user_credit_adjustments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  amount integer not null,
  reason text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null unique,
  stripe_customer_id text not null unique,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'max')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '1 month'),
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists stripe_price_id text;

create table if not exists public.templates (
  id text primary key,
  name text not null,
  description text not null,
  category text not null,
  icon text not null,
  preview_image text,
  base_prompt text not null,
  features text[] not null default '{}',
  tags text[] not null default '{}',
  is_premium boolean not null default false,
  usage_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.deployments (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  platform text not null check (platform in ('vercel', 'expo', 'github')),
  status text not null default 'pending' check (status in ('pending', 'building', 'deployed', 'failed')),
  url text,
  build_logs text,
  deployed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.github_connections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null unique,
  github_user_id bigint,
  github_username text not null,
  access_token text not null,
  connected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.app_versions (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  version_number integer not null default 1,
  prompt text not null,
  generated_code jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.prompts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- Indexes
-- =========================================================================

create index if not exists idx_user_profiles_ip_hash on public.user_profiles(ip_hash);
create index if not exists idx_projects_user_id        on public.projects(user_id);
create index if not exists idx_projects_status         on public.projects(status);
create index if not exists idx_generations_user_id    on public.generations(user_id);
create index if not exists idx_generations_project_id on public.generations(project_id);
create index if not exists idx_daily_ai_usage_user_id on public.daily_ai_usage(user_id);
create index if not exists idx_daily_ai_usage_usage_date on public.daily_ai_usage(usage_date);
create index if not exists idx_credit_usage_events_user_id on public.credit_usage_events(user_id);
create index if not exists idx_credit_usage_events_project_id on public.credit_usage_events(project_id);
create index if not exists idx_credit_usage_events_event_type on public.credit_usage_events(event_type);
create index if not exists idx_referral_codes_user_id on public.referral_codes(user_id);
create index if not exists idx_referrals_referrer_user_id on public.referrals(referrer_user_id);
create index if not exists idx_referrals_referred_user_id on public.referrals(referred_user_id);
create index if not exists idx_referrals_status on public.referrals(status);
create index if not exists idx_user_credit_adjustments_user_id on public.user_credit_adjustments(user_id);
create index if not exists idx_deployments_project_id on public.deployments(project_id);
create index if not exists idx_deployments_user_id    on public.deployments(user_id);
create index if not exists idx_github_exports_project_id on public.github_exports(project_id);
create index if not exists idx_github_exports_user_id on public.github_exports(user_id);
create index if not exists idx_app_versions_project_id on public.app_versions(project_id);
create index if not exists idx_prompts_user_id        on public.prompts(user_id);

-- =========================================================================
-- updated_at trigger
-- =========================================================================

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.update_updated_at_column();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row execute function public.update_updated_at_column();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.update_updated_at_column();

-- =========================================================================
-- Auto-create user profile on auth.users insert
-- =========================================================================

-- Function to check for IP abuse during signup
create or replace function public.check_ip_abuse(ip_hash_param text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  abuse_count integer;
begin
  -- Count free plan accounts with this IP that have exhausted their generations
  select count(*)
  into abuse_count
  from public.user_profiles
  where ip_hash = ip_hash_param
    and plan = 'free'
    and generations_used_this_week >= 3;

  -- If more than 2 accounts from this IP have exhausted free generations, flag as abuse
  return abuse_count > 2;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_ip_hash text;
  is_abuse boolean;
  generated_referral_code text;
begin
  -- Get IP hash from user metadata (will be set by the auth callback)
  user_ip_hash := new.raw_user_meta_data->>'ip_hash';

  -- Check if this IP has been used for abuse
  is_abuse := false;
  if user_ip_hash is not null then
    is_abuse := public.check_ip_abuse(user_ip_hash);
  end if;

  -- Create user profile with IP hash and abuse flag
  insert into public.user_profiles (id, email, full_name, avatar_url, ip_hash, abuse_detected)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    user_ip_hash,
    is_abuse
  )
  on conflict (id) do nothing;

  loop
    generated_referral_code := 'QORVEX-' || upper(substring(md5(new.id::text || random()::text || clock_timestamp()::text) from 1 for 6));
    begin
      insert into public.referral_codes (user_id, code)
      values (new.id, generated_referral_code);
      exit;
    exception
      when unique_violation then
        -- regenerate until unique
    end;
  end loop;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- Row Level Security
-- =========================================================================

alter table public.user_profiles      enable row level security;
alter table public.projects           enable row level security;
alter table public.generations        enable row level security;
alter table public.daily_ai_usage     enable row level security;
alter table public.credit_usage_events enable row level security;
alter table public.referral_codes     enable row level security;
alter table public.referrals          enable row level security;
alter table public.user_credit_adjustments enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.deployments        enable row level security;
alter table public.github_connections enable row level security;
alter table public.github_exports     enable row level security;
alter table public.app_versions       enable row level security;
alter table public.prompts            enable row level security;
alter table public.templates          enable row level security;

-- user_profiles
drop policy if exists "Users can view own profile"   on public.user_profiles;
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.user_profiles;
create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

-- projects
drop policy if exists "Users can view own projects"   on public.projects;
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create projects"    on public.projects;
create policy "Users can create projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- generations
drop policy if exists "Users can view own generations"  on public.generations;
create policy "Users can view own generations"
  on public.generations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create generations"    on public.generations;
create policy "Users can create generations"
  on public.generations for insert
  with check (auth.uid() = user_id);

-- daily_ai_usage
drop policy if exists "Users can view own daily ai usage" on public.daily_ai_usage;
create policy "Users can view own daily ai usage"
  on public.daily_ai_usage for select
  using (auth.uid() = user_id);

-- credit_usage_events
drop policy if exists "Users can view own credit usage events" on public.credit_usage_events;
create policy "Users can view own credit usage events"
  on public.credit_usage_events for select
  using (auth.uid() = user_id);

-- referral_codes
drop policy if exists "Users can view own referral code" on public.referral_codes;
create policy "Users can view own referral code"
  on public.referral_codes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own referral code" on public.referral_codes;
create policy "Users can create own referral code"
  on public.referral_codes for insert
  with check (auth.uid() = user_id);

-- referrals
drop policy if exists "Users can view referrals they sent" on public.referrals;
create policy "Users can view referrals they sent"
  on public.referrals for select
  using (auth.uid() = referrer_user_id);

drop policy if exists "Users can view referrals about themselves" on public.referrals;
create policy "Users can view referrals about themselves"
  on public.referrals for select
  using (auth.uid() = referred_user_id);

drop policy if exists "Users can create referrals about themselves" on public.referrals;
create policy "Users can create referrals about themselves"
  on public.referrals for insert
  with check (auth.uid() = referred_user_id);

-- user_credit_adjustments
drop policy if exists "Users can view own credit adjustments" on public.user_credit_adjustments;
create policy "Users can view own credit adjustments"
  on public.user_credit_adjustments for select
  using (auth.uid() = user_id);

-- subscriptions
drop policy if exists "Users can view own subscription" on public.subscriptions;
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- deployments
drop policy if exists "Users can view own deployments"   on public.deployments;
create policy "Users can view own deployments"
  on public.deployments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create deployments"     on public.deployments;
create policy "Users can create deployments"
  on public.deployments for insert
  with check (auth.uid() = user_id);

-- github_connections
drop policy if exists "Users can view own github connection"   on public.github_connections;
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

-- github_exports
drop policy if exists "Users can view own github exports" on public.github_exports;
create policy "Users can view own github exports"
  on public.github_exports for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own github exports" on public.github_exports;
create policy "Users can create own github exports"
  on public.github_exports for insert
  with check (auth.uid() = user_id);

-- app_versions
drop policy if exists "Users can view versions of own projects"   on public.app_versions;
create policy "Users can view versions of own projects"
  on public.app_versions for select
  using (auth.uid() = (select user_id from public.projects where id = app_versions.project_id));

drop policy if exists "Users can create versions for own projects" on public.app_versions;
create policy "Users can create versions for own projects"
  on public.app_versions for insert
  with check (auth.uid() = (select user_id from public.projects where id = app_versions.project_id));

-- prompts
drop policy if exists "Users can manage own prompts" on public.prompts;
create policy "Users can manage own prompts"
  on public.prompts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- templates (public read)
drop policy if exists "Anyone can view templates" on public.templates;
create policy "Anyone can view templates"
  on public.templates for select
  using (true);

-- Daily AI credits now reset automatically by usage_date (UTC) instead of a
-- scheduled counter reset job. Each day receives its own row in
-- public.daily_ai_usage, which makes resets production-safe and idempotent.
