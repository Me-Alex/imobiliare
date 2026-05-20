create or replace function public.book_appointment_slot(
  payload jsonb,
  p_client_user_id uuid,
  p_actor text
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.book_appointment_slot(payload);
$$;

revoke all on function public.book_appointment_slot(jsonb, uuid, text) from public;
grant execute on function public.book_appointment_slot(jsonb, uuid, text) to anon, authenticated;
