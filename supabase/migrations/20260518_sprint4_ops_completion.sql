-- Sprint 4: provider job processing, owner analytics, observability and SEO CMS support.

alter table public.admin_provider_jobs add column if not exists next_attempt_at timestamptz;
alter table public.admin_provider_jobs add column if not exists locked_at timestamptz;
alter table public.admin_provider_jobs add column if not exists locked_by text;
alter table public.admin_provider_jobs add column if not exists completed_at timestamptz;

update public.admin_provider_jobs
set next_attempt_at = coalesce(next_attempt_at, created_at, now())
where status in ('QUEUED', 'RETRYING', 'FAILED_PROVIDER')
  and next_attempt_at is null;

create index if not exists idx_admin_provider_jobs_due
  on public.admin_provider_jobs(status, next_attempt_at, created_at)
  where status in ('QUEUED', 'RETRYING', 'FAILED_PROVIDER');

create index if not exists idx_admin_provider_jobs_entity_action
  on public.admin_provider_jobs(action, entity, entity_id, created_at desc);

alter table public.admin_notification_outbox add column if not exists provider_job_id uuid references public.admin_provider_jobs(id) on delete set null;
alter table public.admin_notification_outbox add column if not exists last_error text;
alter table public.admin_notification_outbox add column if not exists html text;

create index if not exists idx_admin_notification_outbox_due
  on public.admin_notification_outbox(status, due_at, created_at)
  where status in ('QUEUED', 'PENDING', 'RETRYING');

create index if not exists idx_appointments_reminder_due
  on public.appointments(status, reminder_at)
  where reminder_at is not null and status in ('REQUESTED', 'CONFIRMED');

create index if not exists idx_appointment_slots_held_timeout
  on public.appointment_slots(status, updated_at)
  where status = 'HELD';

create index if not exists idx_leads_property_created
  on public.leads(property_id, created_at desc)
  where property_id is not null;

create index if not exists idx_appointments_property_created
  on public.appointments(property_id, created_at desc)
  where property_id is not null;

create index if not exists idx_property_offers_property_created
  on public.property_offers(property_id, created_at desc)
  where property_id is not null;

create index if not exists idx_cms_entries_key_status
  on public.cms_entries(key, status);

insert into public.cms_entries(key, title, section, status, content, seo, updated_at)
values
  (
    'zone.pipera.apartamente',
    'Apartamente in Pipera',
    'programmatic-seo',
    'PUBLISHED',
    jsonb_build_object(
      'headline', 'Apartamente in Pipera pentru familii si investitori',
      'body', 'Ghid actualizat pentru apartamente in Pipera: preturi, randament, acces, scoli, documente si proprietati active verificate de HQS.',
      'faq', jsonb_build_array(
        jsonb_build_object('question', 'Ce buget este realist pentru un apartament in Pipera?', 'answer', 'Bugetul depinde de suprafata, ansamblu si acces, dar analiza porneste de la pretul mediu pe mp din Market Data.'),
        jsonb_build_object('question', 'Ce verifica HQS inainte de oferta?', 'answer', 'Verificam actele, pretul/mp, istoricul cladirii, costurile lunare si lichiditatea la revanzare.')
      )
    ),
    jsonb_build_object(
      'title', 'Apartamente in Pipera | Preturi, randament si proprietati HQS',
      'description', 'Ghid local pentru apartamente in Pipera cu date de piata, FAQ, checklist si proprietati active.'
    ),
    now()
  )
on conflict (key) do update set
  title = excluded.title,
  section = excluded.section,
  status = excluded.status,
  content = excluded.content,
  seo = excluded.seo,
  updated_at = now();
