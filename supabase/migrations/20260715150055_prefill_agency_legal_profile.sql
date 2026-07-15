-- Public identification data verified on 2026-07-15 from:
-- https://listafirme.ro/hqs-imobiliare-srl-52014343/
-- Contact, representative and privacy-notice fields intentionally remain
-- incomplete because the public source masks or omits them.
update public.agency_legal_profiles
set
  status = 'INCOMPLETE',
  legal_name = 'HQS IMOBILIARE SRL',
  trade_name = 'HQS Imobiliare',
  legal_form = 'SRL',
  cui = '52014343',
  trade_registry_number = 'J2025044682007',
  registered_office = 'Str. Sg. Constantin Moise nr. 5D, bl. 2, sc. 2, ap. B5, Sector 6, București, România',
  updated_at = now()
where is_current;
