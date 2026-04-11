-- ─── Session 6: User Tiers ────────────────────────────────────────────────────
-- Run this in Supabase SQL Editor → New Query → Run
-- Creates the user_tiers table that backs the paywall system.

create table if not exists public.user_tiers (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  tier                   text not null default 'free' check (tier in ('free', 'pro', 'trader', 'quant')),
  stripe_customer_id     text,
  stripe_subscription_id text,
  grant_reason           text,           -- 'stripe_checkout' | 'manual' | 'promo'
  granted_at             timestamptz default now(),
  expires_at             timestamptz,    -- null = no expiry (annual/lifetime)
  created_at             timestamptz default now(),
  updated_at             timestamptz default now(),

  unique(user_id)
);

-- RLS: users can only read their own tier row; only service role can write
alter table public.user_tiers enable row level security;

create policy "Users can view own tier"
  on public.user_tiers for select
  using (auth.uid() = user_id);

-- Allow service role (Stripe webhook) to upsert
create policy "Service role full access"
  on public.user_tiers for all
  using (auth.role() = 'service_role');

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_tiers_updated_at
  before update on public.user_tiers
  for each row execute procedure public.set_updated_at();

-- Indexes
create index if not exists user_tiers_user_id_idx on public.user_tiers(user_id);
create index if not exists user_tiers_stripe_customer_id_idx on public.user_tiers(stripe_customer_id);
