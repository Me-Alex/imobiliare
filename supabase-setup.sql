-- HQS Imobiliare - Supabase bootstrap
-- Intended for a fresh project. Review before running against an existing schema.

CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  city TEXT NOT NULL DEFAULT 'Bucuresti',
  county TEXT,
  address TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
  lng DOUBLE PRECISION CHECK (lng IS NULL OR lng BETWEEN -180 AND 180),
  area_sqm NUMERIC NOT NULL DEFAULT 0 CHECK (area_sqm >= 0),
  rooms INTEGER NOT NULL DEFAULT 0 CHECK (rooms >= 0),
  bathrooms INTEGER NOT NULL DEFAULT 0 CHECK (bathrooms >= 0),
  floor INTEGER,
  year_built INTEGER,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  cover_image_url TEXT,
  gallery_urls TEXT[] NOT NULL DEFAULT '{}',
  floorplan_urls TEXT[] NOT NULL DEFAULT '{}',
  transaction_type TEXT NOT NULL,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_email TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS properties_status_idx ON public.properties(status);
CREATE INDEX IF NOT EXISTS properties_city_idx ON public.properties(city);
CREATE INDEX IF NOT EXISTS properties_type_idx ON public.properties(type);
CREATE INDEX IF NOT EXISTS properties_transaction_type_idx ON public.properties(transaction_type);
CREATE INDEX IF NOT EXISTS properties_agent_id_idx ON public.properties(agent_id);
CREATE INDEX IF NOT EXISTS properties_price_idx ON public.properties(price);

-- These names are app-specific so rerunning the bootstrap does not touch unrelated policies.
DROP POLICY IF EXISTS "hqs_public_read_published" ON public.properties;
DROP POLICY IF EXISTS "hqs_owner_read" ON public.properties;
DROP POLICY IF EXISTS "hqs_owner_insert" ON public.properties;
DROP POLICY IF EXISTS "hqs_owner_update" ON public.properties;
DROP POLICY IF EXISTS "hqs_owner_delete" ON public.properties;

CREATE POLICY "hqs_public_read_published"
  ON public.properties
  FOR SELECT
  TO anon, authenticated
  USING (status = 'PUBLISHED');

CREATE POLICY "hqs_owner_read"
  ON public.properties
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = agent_id);

CREATE POLICY "hqs_owner_insert"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = agent_id);

CREATE POLICY "hqs_owner_update"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = agent_id)
  WITH CHECK ((SELECT auth.uid()) = agent_id);

CREATE POLICY "hqs_owner_delete"
  ON public.properties
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = agent_id);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.properties TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.properties TO authenticated;

CREATE OR REPLACE FUNCTION public.hqs_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.hqs_set_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hqs_set_updated_at() TO authenticated, service_role;

DROP TRIGGER IF EXISTS hqs_properties_set_updated_at ON public.properties;
CREATE TRIGGER hqs_properties_set_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.hqs_set_updated_at();
