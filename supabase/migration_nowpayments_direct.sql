-- =========================================================================
-- Qorvex — NOWPayments direct payment columns
-- =========================================================================
-- Follow-up to migration_nowpayments.sql. Adds the columns needed to render a
-- custom in-app checkout page (pay address, exact pay amount, expiration).
--
-- Run this in the Supabase SQL editor BEFORE deploying the custom crypto
-- checkout page. Idempotent.
-- =========================================================================

alter table public.payments
  add column if not exists pay_address text,
  add column if not exists pay_amount numeric(24, 12),
  add column if not exists payment_status text,
  add column if not exists expires_at timestamptz;
