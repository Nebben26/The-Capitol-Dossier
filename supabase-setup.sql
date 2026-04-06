-- Quiver Markets — Supabase Database Schema
-- Run this in the Supabase SQL Editor to create all tables.

-- ─── MARKETS ─────────────────────────────────────────────────────────
create table if not exists markets (
  id text primary key,
  question text not null,
  slug text,
  platform text not null,
  category text not null default 'Economics',
  price numeric not null default 50,
  previous_price numeric,
  change_24h numeric default 0,
  volume numeric default 0,
  volume_24h numeric default 0,
  liquidity numeric default 0,
  traders integer default 0,
  end_date timestamptz,
  days_left integer default 0,
  outcomes jsonb default '["Yes","No"]'::jsonb,
  outcome_prices jsonb default '[0.5,0.5]'::jsonb,
  clob_token_ids jsonb,
  ticker text,
  url text,
  description text,
  resolved boolean default false,
  resolution text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_markets_platform on markets (platform);
create index if not exists idx_markets_category on markets (category);
create index if not exists idx_markets_updated on markets (updated_at desc);
create index if not exists idx_markets_volume on markets (volume desc);

-- ─── PRICE HISTORY ───────────────────────────────────────────────────
create table if not exists price_history (
  id bigint generated always as identity primary key,
  market_id text not null references markets (id) on delete cascade,
  timestamp timestamptz not null,
  price numeric not null,
  volume numeric default 0
);

create index if not exists idx_price_history_market on price_history (market_id, timestamp desc);

-- ─── WHALE TRADES ────────────────────────────────────────────────────
create table if not exists whale_trades (
  id text primary key,
  wallet_address text not null,
  market_id text,
  side text not null,
  size_usd numeric not null,
  price numeric not null,
  outcome text,
  timestamp timestamptz not null,
  transaction_hash text
);

create index if not exists idx_whale_trades_wallet on whale_trades (wallet_address, timestamp desc);
create index if not exists idx_whale_trades_market on whale_trades (market_id, timestamp desc);
create index if not exists idx_whale_trades_size on whale_trades (size_usd desc);

-- ─── WHALES ──────────────────────────────────────────────────────────
create table if not exists whales (
  address text primary key,
  display_name text,
  total_pnl numeric default 0,
  total_volume numeric default 0,
  win_rate numeric default 0,
  accuracy numeric default 0,
  positions_count integer default 0,
  markets_traded integer default 0,
  rank integer,
  updated_at timestamptz default now()
);

create index if not exists idx_whales_rank on whales (rank asc);
create index if not exists idx_whales_pnl on whales (total_pnl desc);

-- ─── DISAGREEMENTS ───────────────────────────────────────────────────
create table if not exists disagreements (
  id text primary key,
  question text not null,
  poly_market_id text,
  kalshi_market_id text,
  poly_price numeric not null,
  kalshi_price numeric not null,
  spread numeric not null,
  direction text,
  category text,
  spread_trend text default 'stable',
  convergence_rate numeric default 0,
  updated_at timestamptz default now()
);

create index if not exists idx_disagreements_spread on disagreements (spread desc);

-- ─── ROW-LEVEL SECURITY ──────────────────────────────────────────────
alter table markets enable row level security;
alter table price_history enable row level security;
alter table whale_trades enable row level security;
alter table whales enable row level security;
alter table disagreements enable row level security;

create policy "Public read markets" on markets for select using (true);
create policy "Public read price_history" on price_history for select using (true);
create policy "Public read whale_trades" on whale_trades for select using (true);
create policy "Public read whales" on whales for select using (true);
create policy "Public read disagreements" on disagreements for select using (true);

-- ─── AUTO UPDATED_AT ─────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger markets_updated_at
  before update on markets
  for each row execute function update_updated_at();

create trigger whales_updated_at
  before update on whales
  for each row execute function update_updated_at();

create trigger disagreements_updated_at
  before update on disagreements
  for each row execute function update_updated_at();
