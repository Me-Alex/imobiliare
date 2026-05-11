create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  action text not null,
  row_id uuid,
  changed_by text,
  changes jsonb,
  created_at timestamptz not null default now()
);

create or replace function log_admin_changes()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'DELETE') then
    insert into admin_audit_log(table_name, action, row_id, changes)
    values (tg_table_name, tg_op, old.id, to_jsonb(old));
    return old;
  else
    insert into admin_audit_log(table_name, action, row_id, changes)
    values (tg_table_name, tg_op, new.id, jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new)));
    return new;
  end if;
end;
$$;

create trigger audit_properties_changes
after insert or update or delete on properties
for each row execute function log_admin_changes();

create trigger audit_leads_changes
after insert or update or delete on leads
for each row execute function log_admin_changes();
