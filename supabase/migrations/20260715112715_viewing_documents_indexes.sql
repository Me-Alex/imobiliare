-- Cover the foreign keys introduced by the viewing document workflow.
create index if not exists client_documents_template_id_idx
  on public.client_documents(template_id)
  where template_id is not null;

create index if not exists document_events_actor_id_idx
  on public.document_events(actor_id)
  where actor_id is not null;
