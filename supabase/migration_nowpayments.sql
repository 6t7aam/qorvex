-- =========================================================================
-- Qorvex — NOWPayments crypto checkout schema
-- =========================================================================
-- Adds the payments table used by the NOWPayments integration and relaxes
-- the subscriptions table so non-Stripe providers (NOWPayments, manual) can
-- write subscription rows without inventing fake Stripe IDs.
--
-- Run this in the Supabase SQL editor BEFORE deploying /checkout to prod.
-- =========================================================================

create extension if not exists "uuid-ossp";

-- Allow non-stripe providers to record subscription rows.
alter table public.subscriptions
  alter column stripe_customer_id drop not null;

alter table public.subscriptions
  alter column stripe_subscription_id drop not null;

alter table public.subscriptions
  add column if not exists provider text not null default 'stripe';

do $$
begin
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_name = 'subscriptions_provider_check'
  ) then
    alter table public.subscriptions
      add constraint subscriptions_provider_check
      check (provider in ('stripe', 'nowpayments', 'manual'));
  end if;
end$$;

-- =========================================================================
-- payments — single source of truth for NOWPayments invoices
-- =========================================================================
create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  provider text not null default 'nowpayments'
    check (provider in ('nowpayments', 'manual', 'stripe')),
  order_id text not null unique,
  payment_id text,
  invoice_id text,
  subscription_plan text not null check (subscription_plan in ('pro', 'max')),
  amount_usd numeric(10, 2) not null check (amount_usd > 0),
  pay_currency text,
  status text not null default 'pending'
    check (status in (
      'pending',
      'waiting',
      'confirming',
      'confirmed',
      'sending',
      'partially_paid',
      'finished',
      'failed',
      'refunded',
      'expired'
    )),
  invoice_url text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_user_id   on public.payments(user_id);
create index if not exists idx_payments_order_id  on public.payments(order_id);
create index if not exists idx_payments_payment_id on public.payments(payment_id);
create index if not exists idx_payments_status    on public.payments(status);

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
  before update on public.payments
  for each row execute function public.update_updated_at_column();

alter table public.payments enable row level security;

drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- Inserts/updates are performed exclusively through the service-role admin
-- client (NOWPayments webhook + checkout create route). Never expose direct
-- write access to the anon role.
