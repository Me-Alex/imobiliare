-- Fulfillment is coupled to the generated document insert. If either the
-- document or the request update fails, PostgreSQL rolls back both changes.
create or replace function private.auto_fulfill_legal_document_requests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  request_kind text;
begin
  if actor is null or new.template_id is null then
    return new;
  end if;

  request_kind := case new.type
    when 'brokerage_contract' then 'brokerage_agreement'
    when 'owner_mandate' then 'owner_mandate'
    when 'reservation_offer' then 'reservation_offer'
    when 'rental_contract' then 'rental_contract'
    when 'handover_protocol' then 'handover_protocol'
    else null
  end;

  if request_kind is null then
    return new;
  end if;

  update public.legal_document_requests request
  set
    status = 'FULFILLED',
    fulfilled_document_id = new.id,
    handled_by = actor,
    handled_at = clock_timestamp(),
    updated_at = clock_timestamp()
  where request.appointment_id = new.appointment_id
    and request.document_kind = request_kind
    and request.status = 'IN_REVIEW'
    and request.handled_by = actor;

  return new;
end;
$$;

drop trigger if exists auto_fulfill_legal_document_requests_trigger on public.client_documents;
create trigger auto_fulfill_legal_document_requests_trigger
after insert on public.client_documents
for each row execute function private.auto_fulfill_legal_document_requests();

revoke all on function private.auto_fulfill_legal_document_requests() from public, anon, authenticated;

-- Superseded by the atomic trigger above; no public repair endpoint is needed.
drop function if exists public.fulfill_legal_document_requests(uuid);
