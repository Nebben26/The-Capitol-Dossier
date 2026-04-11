-- Session 8: alert_triggers table
-- Stores a record each time an alert fires so users can see notification history.
-- Requires session4-alerts.sql (user_alerts table) to already be applied.
-- Run: psql $DATABASE_URL -f scripts/migrations/session8-alert-triggers.sql

create table if not exists public.alert_triggers (
  id           uuid primary key default gen_random_uuid(),
  alert_id     uuid not null references public.user_alerts(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  message      text not null default '',
  payload      jsonb,
  read         boolean not null default false,
  triggered_at timestamptz not null default now()
);

-- Fast lookup: user's unread triggers
create index if not exists alert_triggers_user_unread_idx
  on public.alert_triggers (user_id, read, triggered_at desc)
  where read = false;

-- Cascade cleanup by alert
create index if not exists alert_triggers_alert_id_idx
  on public.alert_triggers (alert_id);

-- RLS
alter table public.alert_triggers enable row level security;

create policy "Users can select own triggers"
  on public.alert_triggers for select
  using (auth.uid() = user_id);

create policy "Users can update own triggers (mark read)"
  on public.alert_triggers for update
  using (auth.uid() = user_id);

-- Service role can insert triggers (called from the evaluator server route)
create policy "Service role can insert triggers"
  on public.alert_triggers for insert
  with check (true);
