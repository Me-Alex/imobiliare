-- =====================================================
-- HQS Imobiliare - Supabase Setup Script
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================

-- 1. Create the user_properties table
CREATE TABLE IF NOT EXISTS public.user_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'Apartament',
  transaction TEXT NOT NULL DEFAULT 'VANZARE',
  price DOUBLE PRECISION NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  area_sqm DOUBLE PRECISION NOT NULL DEFAULT 0,
  rooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  floor INTEGER,
  total_floors INTEGER,
  year_built INTEGER,
  address TEXT DEFAULT '',
  zone TEXT DEFAULT '',
  sector TEXT DEFAULT '',
  city TEXT DEFAULT 'Bucuresti',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  featured BOOLEAN DEFAULT FALSE,
  cover_url TEXT DEFAULT '',
  gallery_urls TEXT DEFAULT '[]',
  price_per_sqm DOUBLE PRECISION,
  status TEXT DEFAULT 'PUBLISHED',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT DEFAULT '',
  user_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.user_properties ENABLE ROW LEVEL SECURITY;

-- 3. Policy: anyone can read published properties
CREATE POLICY "Public read access"
  ON public.user_properties
  FOR SELECT
  USING (status = 'PUBLISHED');

-- 4. Policy: authenticated users can insert their own properties
CREATE POLICY "Users can insert own properties"
  ON public.user_properties
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Policy: users can update their own properties
CREATE POLICY "Users can update own properties"
  ON public.user_properties
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Policy: users can delete their own properties
CREATE POLICY "Users can delete own properties"
  ON public.user_properties
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_properties_zone ON public.user_properties(zone);
CREATE INDEX IF NOT EXISTS idx_user_properties_type ON public.user_properties(type);
CREATE INDEX IF NOT EXISTS idx_user_properties_transaction ON public.user_properties(transaction);
CREATE INDEX IF NOT EXISTS idx_user_properties_user_id ON public.user_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_user_properties_status ON public.user_properties(status);
CREATE INDEX IF NOT EXISTS idx_user_properties_price ON public.user_properties(price);

-- 8. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.user_properties;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.user_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();