-- Migration: Create ai_pending_actions table for agentic AI maker-checker pattern
-- AI agent tool calls that modify data are stored here for user confirmation before execution.

create table if not exists public.ai_pending_actions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  tenant_id     uuid references public.tenants(id) on delete cascade,
  tool_name     text not null,
  params        jsonb not null default '{}',
  diff          jsonb not null default '{}',
  summary       text,
  status        text not null default 'pending'
                  check (status in ('pending', 'approved', 'rejected', 'executed')),
  executed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Indexes for common queries
create index idx_ai_pending_actions_user_id    on public.ai_pending_actions(user_id);
create index idx_ai_pending_actions_status     on public.ai_pending_actions(status);
create index idx_ai_pending_actions_created_at on public.ai_pending_actions(created_at desc);

-- RLS
alter table public.ai_pending_actions enable row level security;

-- Users can only see their own pending actions
create policy "Users can view own pending actions"
  on public.ai_pending_actions for select
  using (auth.uid() = user_id);

-- Only the system (service role) or the owning user can insert
create policy "Users can create pending actions"
  on public.ai_pending_actions for insert
  with check (auth.uid() = user_id);

-- Users can approve/reject their own pending actions
create policy "Users can update own pending actions"
  on public.ai_pending_actions for update
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.update_ai_pending_actions_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_ai_pending_actions_updated_at
  before update on public.ai_pending_actions
  for each row execute function public.update_ai_pending_actions_timestamp();

-- Grant access
grant select, insert, update on public.ai_pending_actions to authenticated;
