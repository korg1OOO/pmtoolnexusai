-- Create table for hierarchical mind map projects (NexusAI PMTOOL)
-- Stores the full tree as JSONB for simplicity and performance

create table if not exists public.mindmap_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  workspace_id uuid, -- optional, for future multi-workspace support
  name text not null,
  description text,
  data jsonb not null default '{}'::jsonb, -- stores the full MegaProject structure
  overall_progress numeric(5,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  last_edited_at timestamptz default now()
);

-- Enable RLS
alter table public.mindmap_projects enable row level security;

-- Policies: users can only access their own mind map projects
create policy "Users can view their own mind map projects"
  on public.mindmap_projects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own mind map projects"
  on public.mindmap_projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own mind map projects"
  on public.mindmap_projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own mind map projects"
  on public.mindmap_projects for delete
  using (auth.uid() = user_id);

-- Updated at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.mindmap_projects
  for each row execute procedure public.handle_updated_at();

-- Index for faster queries
create index if not exists idx_mindmap_projects_user_id on public.mindmap_projects(user_id);
create index if not exists idx_mindmap_projects_updated_at on public.mindmap_projects(updated_at desc);
