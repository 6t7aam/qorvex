-- =========================================================================
-- Qorvex — Referral program + bonus credit ledger
-- =========================================================================

create extension if not exists "uuid-ossp";

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

create index if not exists idx_referral_codes_user_id
  on public.referral_codes(user_id);

create index if not exists idx_referrals_referrer_user_id
  on public.referrals(referrer_user_id);

create index if not exists idx_referrals_referred_user_id
  on public.referrals(referred_user_id);

create index if not exists idx_referrals_status
  on public.referrals(status);

create index if not exists idx_user_credit_adjustments_user_id
  on public.user_credit_adjustments(user_id);

alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.user_credit_adjustments enable row level security;

drop policy if exists "Users can view own referral code" on public.referral_codes;
create policy "Users can view own referral code"
  on public.referral_codes for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own referral code" on public.referral_codes;
create policy "Users can create own referral code"
  on public.referral_codes for insert
  with check (auth.uid() = user_id);

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

drop policy if exists "Users can view own credit adjustments" on public.user_credit_adjustments;
create policy "Users can view own credit adjustments"
  on public.user_credit_adjustments for select
  using (auth.uid() = user_id);

create or replace function public.ensure_referral_code_for_user(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_code text;
  generated_code text;
begin
  select code into existing_code
  from public.referral_codes
  where user_id = target_user_id;

  if existing_code is not null then
    return existing_code;
  end if;

  loop
    generated_code := 'QORVEX-' || upper(substring(md5(target_user_id::text || random()::text || clock_timestamp()::text) from 1 for 6));
    begin
      insert into public.referral_codes (user_id, code)
      values (target_user_id, generated_code);
      return generated_code;
    exception
      when unique_violation then
        -- retry
    end;
  end loop;
end;
$$;

select public.ensure_referral_code_for_user(id)
from auth.users;
