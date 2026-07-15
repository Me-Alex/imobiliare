-- Preserve the participant's submitted facts and staff explanations in the
-- append-only event stream before the editable request row changes again.
create or replace function private.audit_legal_document_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  next_event text;
  previous_status text;
  submitted_data_snapshot jsonb;
  participant_notes_snapshot text;
begin
  if tg_op = 'INSERT' then
    next_event := 'REQUESTED';
    previous_status := null;
    submitted_data_snapshot := new.submitted_data;
    participant_notes_snapshot := new.notes;
  else
    previous_status := old.status;
    next_event := case
      when new.status is distinct from old.status then new.status
      else 'DATA_UPDATED'
    end;
    submitted_data_snapshot := case
      when new.submitted_data is distinct from old.submitted_data then new.submitted_data
      else null
    end;
    participant_notes_snapshot := case
      when new.notes is distinct from old.notes then new.notes
      else null
    end;
  end if;

  insert into public.legal_document_request_events(request_id, actor_id, event_type, metadata)
  values (
    new.id,
    (select auth.uid()),
    next_event,
    jsonb_build_object(
      'document_kind', new.document_kind,
      'from_status', previous_status,
      'to_status', new.status,
      'fulfilled_document_id', new.fulfilled_document_id,
      'submitted_data', submitted_data_snapshot,
      'participant_notes', participant_notes_snapshot,
      'staff_note', new.staff_note
    )
  );
  return new;
end;
$$;

revoke all on function private.audit_legal_document_request() from public, anon, authenticated;
