-- Tighten direct access to the internal admin secret checker.
--
-- The public admin RPC functions still call this helper server-side through
-- SECURITY DEFINER functions. Direct execution by anon/authenticated clients is
-- unnecessary and expands the probing surface for the shared admin secret gate.
revoke all on function public.admin_secret_is_valid(text) from public;
revoke all on function public.admin_secret_is_valid(text) from anon;
revoke all on function public.admin_secret_is_valid(text) from authenticated;

comment on function public.admin_secret_is_valid(text)
  is 'Internal helper for server-side admin RPC gates. Do not grant direct execute to public API roles.';
