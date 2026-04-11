-- Session 4: Custom threshold alerts
-- Creates user_alerts table for storing per-user market alert rules.
-- Run: psql $DATABASE_URL -f scripts/migrations/session4-alerts.sql
-- DO NOT RUN automatically — requires Supabase project access.

create table if not exists public.user_alerts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  market_id       text not null,
  market_question text not null default '',
  condition       text not null check (condition in (
                    'price_above',
                    'price_below',
                    'spread_above',
                    'volume_above',
                    'whale_entry'
                  )),
  threshold       numeric not null default 0,
  enabled         boolean not null default true,
  created_at      timestamptz not null default now(),
  last_triggered_at timestamptz,
  trigger_count   integer not null default 0
);

-- Index for fast per-user lookup
create index if not exists user_alerts_user_id_idx on public.user_alerts (user_id);

-- Index for evaluator: check alerts by market
create index if not exists user_alerts_market_id_idx on public.user_alerts (market_id) where enabled = true;

-- RLS: users can only see/manage their own alerts
alter table public.user_alerts enable row level security;

create policy "Users can select own alerts"
  on public.user_alerts for select
  using (auth.uid() = user_id);

create policy "Users can insert own alerts"
  on public.user_alerts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own alerts"
  on public.user_alerts for update
  using (auth.uid() = user_id);

create policy "Users can delete own alerts"
  on public.user_alerts for delete
  using (auth.uid() = user_id);
