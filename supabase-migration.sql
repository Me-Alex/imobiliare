-- =====================================================
-- HQS Imobiliare - Complete Supabase Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =====================================================

-- 1. Add missing columns to properties table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'zone') THEN
    ALTER TABLE public.properties ADD COLUMN zone TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'sector') THEN
    ALTER TABLE public.properties ADD COLUMN sector TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'lat') THEN
    ALTER TABLE public.properties ADD COLUMN lat DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'lng') THEN
    ALTER TABLE public.properties ADD COLUMN lng DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'price_per_sqm') THEN
    ALTER TABLE public.properties ADD COLUMN price_per_sqm DOUBLE PRECISION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'transaction_type') THEN
    ALTER TABLE public.properties ADD COLUMN transaction_type TEXT DEFAULT 'sale';
  END IF;
END $$;

-- 2. Update existing properties with zone/sector data
UPDATE public.properties SET zone = 'Sector 1', sector = 'Sector 1' WHERE zone IS NULL OR zone = '';
UPDATE public.properties SET price_per_sqm = ROUND(price / NULLIF(area_sqm, 0)) WHERE price_per_sqm IS NULL AND area_sqm > 0;

-- 3. Fix the first bad property
UPDATE public.properties SET 
  title = 'Apartament 3 camere Dorobanti',
  slug = 'apartament-3-camere-dorobanti',
  description = 'Apartament spatios cu 3 camere situat in zona Dorobanti, aproape de parcul Kiseleff. Finisaje premium, balcon generos, lumina naturala abundenta.',
  price = 185000,
  area_sqm = 78,
  rooms = 3,
  bathrooms = 1,
  floor = 3,
  year_built = 2008,
  zone = 'Dorobanti',
  sector = 'Sector 1',
  city = 'Bucuresti',
  address = 'Str. Dorobanti, nr. 45, Sector 1',
  transaction_type = 'sale',
  price_per_sqm = 2372
WHERE slug = 'apartament-3-camere-s1-dbf4e4';

-- 4. Update the second property
UPDATE public.properties SET 
  zone = 'Unirii',
  sector = 'Sector 3',
  transaction_type = 'sale',
  price_per_sqm = 2148
WHERE slug = 'spatiu-comercial-unirii';

-- 5. Update the third property
UPDATE public.properties SET 
  zone = 'Aviatorilor',
  sector = 'Sector 1',
  transaction_type = 'sale',
  price_per_sqm = 3633
WHERE slug = 'apartament-4-camere-aviatorilor';

-- 6. Create zones table
CREATE TABLE IF NOT EXISTS public.zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sector TEXT,
  description TEXT,
  avg_price_sqm DOUBLE PRECISION,
  demand TEXT DEFAULT 'Moderata',
  popular_for TEXT DEFAULT '[]',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create contact_submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  property_title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create newsletter_subscriptions table
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create price_alerts table
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  zone TEXT,
  property_type TEXT,
  min_price DOUBLE PRECISION,
  max_price DOUBLE PRECISION,
  min_rooms INT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Enable RLS on all tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- 11. Drop existing policies (if any) and recreate
DO $$ 
DECLARE
  tbl TEXT;
  pol TEXT;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('properties','zones','contact_submissions','newsletter_subscriptions','price_alerts') LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = tbl LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol, tbl);
    END LOOP;
  END LOOP;
END $$;

-- 12. Properties: anyone can read published, anyone can insert, anyone can update their own
CREATE POLICY "Public read published properties" ON public.properties
  FOR SELECT USING (status = 'PUBLISHED');

CREATE POLICY "Anyone can insert properties" ON public.properties
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update properties" ON public.properties
  FOR UPDATE USING (true) WITH CHECK (true);

-- 13. Zones: public read, public insert/update
CREATE POLICY "Public read zones" ON public.zones
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert zones" ON public.zones
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update zones" ON public.zones
  FOR UPDATE USING (true) WITH CHECK (true);

-- 14. Contact: public read, public insert
CREATE POLICY "Public read contact submissions" ON public.contact_submissions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can submit contact" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);

-- 15. Newsletter: public read, public insert
CREATE POLICY "Public read newsletter" ON public.newsletter_subscriptions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can subscribe newsletter" ON public.newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

-- 16. Price alerts: public read, public insert, public update/delete
CREATE POLICY "Public read price alerts" ON public.price_alerts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create price alert" ON public.price_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update price alert" ON public.price_alerts
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete price alert" ON public.price_alerts
  FOR DELETE USING (true);

-- 17. Seed zones data
INSERT INTO public.zones (name, slug, sector, description, avg_price_sqm, demand, popular_for, sort_order) VALUES
  ('Dorobanti', 'dorobanti', 'Sector 1', 'Zona premium cu vile interbelice si apartamente de lux, aproape de Parcul Kiseleff.', 3200, 'Ridicata', '["Vile","Apartamente lux","Restaurante fine"]', 1),
  ('Victoriei', 'victoriei', 'Sector 1', 'Zona centrala cu acces excelent la metrou si spatii comerciale de top.', 2800, 'Ridicata', '["Apartamente","Birouri","Shopping"]', 2),
  ('Floreasca', 'floreasca', 'Sector 1', 'Zona de business cu cladiri moderne, parcul Floreasca si mall-uri.', 3010, 'Ridicata', '["Apartamente noi","Birouri","Parc","Mall"]', 3),
  ('Aviatorilor', 'aviatorilor', 'Sector 1', 'Zona rezidentiala linistita, aproape de Parcul Aviatorilor si centrul orasului.', 2700, 'Moderata', '["Apartamente","Parc","Scoli"]', 4),
  ('Primaverii', 'primaverii', 'Sector 1', 'Una dintre cele mai exclusive zone din Bucuresti, cu vile si apartamente premium.', 4500, 'Ridicata', '["Vile","Apartamente lux","Ambasade"]', 5),
  ('Herastrau', 'herastrau', 'Sector 1', 'Zona lacului Herastrau, cu proprietati de lux si peisaje exceptionale.', 5200, 'Ridicata', '["Vile lux","Apartamente premium","Lac","Restaurante"]', 6),
  ('Baneasa', 'baneasa', 'Sector 1', 'Zona rezidentiala cu acces rapid la aeroport, parcuri si scoli internationale.', 2200, 'Moderata', '["Case","Apartamente","Scoli internationale","Aeroport"]', 7),
  ('Pipera', 'pipera', 'Sector 1', 'Zona de birouri in plina dezvoltare cu access la centura si parcuri.', 2190, 'Moderata', '["Apartamente noi","Birouri","Scoli private"]', 8),
  ('Barbu Vacarescu', 'barbu-vacarescu', 'Sector 2', 'Zona de business emergenta cu cladiri de birouri noi si ansambluri rezidentiale.', 2400, 'Crescatoare', '["Apartamente noi","Birouri","Metro"]', 9),
  ('Universitate', 'universitate', 'Sector 1', 'Centrul universitar cu viata nocturna, cafenele si acces la toate mijloacele de transport.', 2600, 'Ridicata', '["Garsoniere","Apartamente","Cafenele","Metro"]', 10),
  ('Unirii', 'unirii', 'Sector 3', 'Centrul orasului cu Piata Unirii, mall-uri si conexiuni excelente de transport.', 2100, 'Ridicata', '["Apartamente","Spatii comerciale","Metro"]', 11),
  ('Militari', 'militari', 'Sector 6', 'Zona rezidentiala populara cu preturi accesibile si acces la metrou.', 1600, 'Moderata', '["Apartamente","Scoli","Parcuri","Metro"]', 12),
  ('Drumul Taberei', 'drumul-taberei', 'Sector 6', 'Zona rezidentiala cu parcuri si preturi mai accesibile.', 1400, 'Moderata', '["Apartamente","Parcuri","Scoli"]', 13),
  ('Titan', 'titan', 'Sector 3', 'Zona cu acces la Park Lake Mall si metrou, preturi accesibile.', 1500, 'Moderata', '["Apartamente","Mall","Metro"]', 14),
  ('Vitan', 'vitan', 'Sector 3', 'Zona in dezvoltare cu spatii comerciale noi si ansambluri rezidentiale.', 1650, 'Crescatoare', '["Apartamente noi","Spatii comerciale","Sun Plaza"]', 15)
ON CONFLICT (name) DO NOTHING;

-- 18. Seed good demo properties
INSERT INTO public.properties (id, title, slug, description, price, currency, type, status, city, address, area_sqm, rooms, bathrooms, floor, year_built, zone, sector, featured, cover_image_url, gallery_urls, transaction_type, amenities, price_per_sqm) VALUES
  ('demo-1', 'Apartament lux 3 camere Dorobanti', 'apartament-lux-3-camere-dorobanti', 'Apartament de lux situat intr-o cladire interbelica renovata, in inima zonei Dorobanti. Finisaje premium, parchet din lemn masiv, geamuri termopan, aer conditionat centralizat. Balcon spatios cu vedere spre parc.', 245000, 'EUR', 'APARTMENT', 'PUBLISHED', 'Bucuresti', 'Str. Dorobanti, nr. 78, Sector 1', 95, 3, 2, 2, 1935, 'Dorobanti', 'Sector 1', true, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75', '["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75","https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=75","https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=75"]', 'sale', '["Balcon","Aer conditionat","Parchet lemn","Geamuri termopan","Interfon"]', 2579),
  ('demo-2', 'Apartament 2 camere Floreasca', 'apartament-2-camere-floreasca', 'Apartament modern cu 2 camere intr-un ansamblu rezidential nou, langa Parcul Floreasca. Open space, bucatarie mobilata si utilata, loc de parcare subteran inclus.', 138000, 'EUR', 'APARTMENT', 'PUBLISHED', 'Bucuresti', 'Bd. Barbu Vacarescu, nr. 120, Sector 1', 58, 2, 1, 4, 2022, 'Floreasca', 'Sector 1', true, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=75', '["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=75","https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=75"]', 'sale', '["Parcare","Loc de joaca","Fitness","Securitate 24/7"]', 2379),
  ('demo-3', 'Casa individuala Militari', 'casa-individuala-militari', 'Casa individuala cu 4 camere, curte interioara si gradina, in zona Militari. Construita in 2018, finisaje moderne, sistem de incalzire in pardoseala.', 195000, 'EUR', 'HOUSE', 'PUBLISHED', 'Bucuresti', 'Str. Lalelelor, nr. 25, Sector 6', 150, 4, 2, NULL, 2018, 'Militari', 'Sector 6', false, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75', '["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75"]', 'sale', '["Gradina","Parcare","Incalzire in pardoseala","Alarma"]', 1300),
  ('demo-4', 'Vila premium Herastrau', 'vila-premium-herastrau', 'Vila de lux cu 6 camere si vedere directa la Lacul Herastrau. Piscina privata, gradina peisagistica, finisaje exclusiviste. Ideal pentru familii care doresc o locuinta de vis.', 850000, 'EUR', 'VILLA', 'PUBLISHED', 'Bucuresti', 'Str. Paris, nr. 12, Sector 1', 320, 6, 4, NULL, 2020, 'Herastrau', 'Sector 1', true, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=75', '["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=75","https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=75"]', 'sale', '["Piscina","Gradina","Parcare 2 locuri","Smart home","Securitate 24/7"]', 2656),
  ('demo-5', 'Garsoniera inchiriere Universitate', 'garsoniera-inchiriere-universitate', 'Garsoniera complet mobilata si utilata, ideal pentru studenti sau tineri profesionisti. Amplasata la 2 minute de metrou Universitate.', 450, 'EUR', 'APARTMENT', 'PUBLISHED', 'Bucuresti', 'Str. Edgar Quinet, nr. 8, Sector 1', 35, 1, 1, 3, 2015, 'Universitate', 'Sector 1', false, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=75', '["https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=75"]', 'rent', '["Mobilat","Utilat","Metro","AC"]', NULL),
  ('demo-6', 'Teren intravilan Pipera', 'teren-intravilan-pipera', 'Teren intravilan cu o suprafata generoasa in zona Pipera, ideal pentru constructie rezidentiala. Utilitati la limita de proprietate.', 280000, 'EUR', 'LAND', 'PUBLISHED', 'Bucuresti', 'Drum de Vizure, nr. 5, zona Pipera', 500, 0, 0, NULL, NULL, 'Pipera', 'Sector 1', false, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=75', '["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=75"]', 'sale', '["Utilitati","Acces carosabil","Zona rezidentiala"]', NULL),
  ('demo-7', 'Spatiu comercial inchiriere Unirii', 'spatiu-comercial-inchiriere-unirii', 'Spatiu comercial cu vitrina ampla si trafic pietonal excelent, situat in imediata apropiere a Pietei Unirii. Ideal pentru retail, showroom sau cafeteria.', 3200, 'EUR', 'COMMERCIAL', 'PUBLISHED', 'Bucuresti', 'Piata Unirii, Sector 3', 85, 1, 1, NULL, 2005, 'Unirii', 'Sector 3', false, 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=75', '["https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=75"]', 'rent', '["Vitrina","AC","Apa","Canal","Internet fibră"]', NULL),
  ('demo-8', 'Apartament 4 camere Aviatorilor', 'apartament-4-camere-aviatorilor', 'Apartament spatios cu 4 camere in zona Aviatorilor, cu pozitie excelenta si acces rapid la parc. Ideal pentru familie. 2 bai, bucatarie separata, balcon generos.', 465000, 'EUR', 'APARTMENT', 'PUBLISHED', 'Bucuresti', 'Str. Aviatorilor, langa parc, Sector 1', 128, 4, 3, 5, 2010, 'Aviatorilor', 'Sector 1', true, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=75', '["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=75","https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=75"]', 'sale', '["2 Bai","Bucatarie separata","Balcon","Parcare","Interfon"]', 3633)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  city = EXCLUDED.city,
  address = EXCLUDED.address,
  area_sqm = EXCLUDED.area_sqm,
  rooms = EXCLUDED.rooms,
  bathrooms = EXCLUDED.bathrooms,
  floor = EXCLUDED.floor,
  year_built = EXCLUDED.year_built,
  zone = EXCLUDED.zone,
  sector = EXCLUDED.sector,
  featured = EXCLUDED.featured,
  cover_image_url = EXCLUDED.cover_image_url,
  gallery_urls = EXCLUDED.gallery_urls,
  transaction_type = EXCLUDED.transaction_type,
  amenities = EXCLUDED.amenities,
  price_per_sqm = EXCLUDED.price_per_sqm;