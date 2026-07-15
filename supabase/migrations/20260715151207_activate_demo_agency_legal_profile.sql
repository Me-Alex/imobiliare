-- Temporary test fixture. Every invented value is explicitly marked DEMO and
-- must be replaced with verified company data before production use.
update public.agency_legal_profiles
set
  status = 'ACTIVE',
  email = 'demo-juridic@hqsimobiliare.invalid',
  phone = '+40 700 000 000 (DEMO)',
  representative_name = 'Reprezentant legal HQS - DEMO',
  representative_capacity = 'Administrator - DEMO',
  privacy_notice_url = 'https://hqs-imobiliare.floreaalexandru2002.workers.dev/confidentialitate',
  privacy_notice_version = 'DEMO-2026-07-15',
  consumer_notice_version = 'DEMO-2026-07-15',
  updated_at = clock_timestamp()
where is_current
  and legal_name = 'HQS IMOBILIARE SRL'
  and cui = '52014343';

do $$
begin
  if not exists (
    select 1
    from public.agency_legal_profiles
    where is_current
      and status = 'ACTIVE'
      and privacy_notice_version = 'DEMO-2026-07-15'
  ) then
    raise exception 'Demo legal profile could not be activated';
  end if;
end;
$$;
