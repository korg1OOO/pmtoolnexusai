create table if not exists public.support_tickets (
  id uuid not null default gen_random_uuid(),
  created_at timestamp with time zone not null default now(),
  name text not null,
  email text not null,
  subject text null,
  message text not null,
  status text not null default 'new'::text,
  constraint support_tickets_pkey primary key (id)
);

alter table public.support_tickets enable row level security;

create policy "Enable insert for authenticated users only"
on "public"."support_tickets"
as PERMISSIVE
for INSERT
to authenticated
with check (true);

create policy "Enable insert for anon users (Simulated Public)"
on "public"."support_tickets"
as PERMISSIVE
for INSERT
to anon
with check (true);

create policy "Enable read for authenticated users only"
on "public"."support_tickets"
as PERMISSIVE
for SELECT
to authenticated
using (true);
