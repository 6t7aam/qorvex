-- =========================================================================
-- Qorvex — Manual payments (semi-automated bank-transfer flow)
-- =========================================================================
-- Run this in the Supabase SQL editor on the live project. It is idempotent.
-- After running, also create the "payment-screenshots" storage bucket and
-- the storage policies at the bottom of this file.
-- =========================================================================

create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------------------
-- manual_payments table
-- -------------------------------------------------------------------------
create table if not exists public.manual_payments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  order_id text not null unique,
  plan text not null check (plan in ('pro', 'max')),
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  screenshot_url text,
  payment_comment text,
  admin_note text,
  confirmed_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_manual_payments_user_id  on public.manual_payments(user_id);
create index if not exists idx_manual_payments_status   on public.manual_payments(status);
create index if not exists idx_manual_payments_order_id on public.manual_payments(order_id);

alter table public.manual_payments enable row level security;

drop policy if exists "Users can view own payments" on public.manual_payments;
create policy "Users can view own payments"
  on public.manual_payments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create payments" on public.manual_payments;
create policy "Users can create payments"
  on public.manual_payments for insert
  with check (auth.uid() = user_id);

create or replace function public.update_manual_payments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_manual_payments_updated_at on public.manual_payments;
create trigger set_manual_payments_updated_at
  before update on public.manual_payments
  for each row execute function public.update_manual_payments_updated_at();

-- -------------------------------------------------------------------------
-- user_profiles.pending_plan
-- -------------------------------------------------------------------------
alter table public.user_profiles
  add column if not exists pending_plan text;

-- -------------------------------------------------------------------------
-- Storage bucket + policies (private bucket)
-- Upload paths use: auth.uid()/ORDER-123456/timestamp-filename.ext
-- Service-role reads bypass RLS automatically. The admin screenshot route uses
-- the service-role client for signed URLs, so no separate admin SELECT policy
-- is required unless you later move admin reads to an authenticated browser
-- client instead of the server.
-- -------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('payment-screenshots', 'payment-screenshots', false)
  on conflict (id) do nothing;

drop policy if exists "Users can upload payment screenshots" on storage.objects;
create policy "Users can upload payment screenshots"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can view own screenshots" on storage.objects;
create policy "Users can view own screenshots"
  on storage.objects for select
  using (
    bucket_id = 'payment-screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admin reads via the service-role client (bypasses RLS), so no admin
-- read policy is required here. Add one only if you ever read screenshots
-- with the anon key on the admin page.
