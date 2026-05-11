-- Migration: lead notes audit trail
create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_notes_lead_id_created_at_idx on public.lead_notes (lead_id, created_at desc);

alter table public.lead_notes enable row level security;

create policy if not exists "lead_notes_select_authenticated" on public.lead_notes
  for select to authenticated
  using (true);

create policy if not exists "lead_notes_insert_authenticated" on public.lead_notes
  for insert to authenticated
  with check (true);
