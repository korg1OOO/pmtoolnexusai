-- Create features table
create table if not exists public.features (
    key text primary key,
    name text not null,
    description text,
    category text not null default 'CORE', -- CORE, ADVANCED, EXPERIMENTAL
    min_plan_tier text not null default 'free',
    is_enabled boolean not null default true,
    sort_order integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.features enable row level security;

-- Policies
do $$
begin
  -- Public read policy (no dependency)
  if not exists (select 1 from pg_policies where policyname = 'Public features are viewable by everyone' and tablename = 'features') then
    create policy "Public features are viewable by everyone" on public.features for select using (true);
  end if;

  -- Admin policies (depend on user_roles) - only create if user_roles exists
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_roles') then
      if not exists (select 1 from pg_policies where policyname = 'Admins can insert features' and tablename = 'features') then
        create policy "Admins can insert features" on public.features for insert with check (
            auth.role() = 'service_role' 
            or exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
        );
      end if;

      if not exists (select 1 from pg_policies where policyname = 'Admins can update features' and tablename = 'features') then
        create policy "Admins can update features" on public.features for update using (
            auth.role() = 'service_role' 
            or exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
        );
      end if;

      if not exists (select 1 from pg_policies where policyname = 'Admins can delete features' and tablename = 'features') then
        create policy "Admins can delete features" on public.features for delete using (
            auth.role() = 'service_role' 
            or exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
        );
      end if;
  end if;
end
$$;

-- Seed Data (Kiroxys Features)
insert into public.features (key, name, category, min_plan_tier, sort_order) values
('tube_map', 'Tube Map', 'CORE', 'free', 10),
('process_mapper', 'Process Workbench', 'CORE', 'free', 20),
('process_flows', 'Process Flows', 'CORE', 'free', 30),
('impact_analysis', 'Impact Analysis', 'CORE', 'free', 40),
('presentations', 'Presentations', 'CORE', 'starter', 50),
('route_planner', 'Route Planner', 'ADVANCED', 'starter', 60),
('design_studio', 'Design Studio', 'ADVANCED', 'pro', 70)
on conflict (key) do nothing;
