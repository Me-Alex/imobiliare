import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(url, key)

export type PropertyType = 'APARTMENT' | 'HOUSE' | 'VILLA' | 'LAND' | 'COMMERCIAL'
export type PropertyStatus = 'PUBLISHED' | 'DRAFT' | 'SOLD' | 'RENTED'

export interface Property {
  id: string
  title: string
  slug: string
  description: string
  price: number
  currency: string
  type: PropertyType
  status: PropertyStatus
  city: string
  county: string
  address: string
  area_sqm: number
  rooms: number
  bathrooms: number
  parking_spots: number
  featured: boolean
  published_at: string
  created_at: string
}

export interface Lead {
  id?: string
  name: string
  email?: string
  phone: string
  message?: string
  status?: string
  source?: string
  property_id?: string
}


export const propertiesSeed = [
  { title: "Vilă modernă cu grădină în Corbeanca", slug: "vila-moderna-cu-gradina-corbeanca", description: "Vilă luminoasă, cu living generos, curte amenajată și acces rapid către zona de nord.", price: 385000, currency: "EUR", type: "VILLA", status: "PUBLISHED", city: "Corbeanca", county: "Ilfov", address: "Corbeanca, zona Paradisul Verde", area_sqm: 210, rooms: 5, bathrooms: 4, parking_spots: 2, featured: true },
  { title: "Apartament 3 camere în Floreasca", slug: "apartament-3-camere-floreasca", description: "Apartament renovat, etaj intermediar, finisaje curate și poziție bună pentru birou sau locuit.", price: 245000, currency: "EUR", type: "APARTMENT", status: "PUBLISHED", city: "Bucuresti", county: "Bucuresti", address: "Floreasca, str. intrare linistita", area_sqm: 92, rooms: 3, bathrooms: 2, parking_spots: 1, featured: true },
  { title: "Casă individuală în Băneasa", slug: "casa-individuala-baneasa", description: "Casă pe teren propriu, compartimentare echilibrată și curte suficientă pentru familie.", price: 520000, currency: "EUR", type: "HOUSE", status: "PUBLISHED", city: "Bucuresti", county: "Bucuresti", address: "Băneasa, aproape de pădure", area_sqm: 240, rooms: 6, bathrooms: 4, parking_spots: 2, featured: false },
  { title: "Penthouse cu terasă în Aviatorilor", slug: "penthouse-terasa-aviatorilor", description: "Penthouse cu vedere deschisă, terasă mare și acces rapid la parc și metrou.", price: 690000, currency: "EUR", type: "APARTMENT", status: "PUBLISHED", city: "Bucuresti", county: "Bucuresti", address: "Aviatorilor, zonă premium", area_sqm: 165, rooms: 4, bathrooms: 3, parking_spots: 2, featured: true },
  { title: "Teren intravilan în Pipera", slug: "teren-intravilan-pipera", description: "Teren potrivit pentru dezvoltare rezidențială, cu acces bun și utilități în zonă.", price: 330000, currency: "EUR", type: "LAND", status: "PUBLISHED", city: "Pipera", county: "Ilfov", address: "Pipera, zona de nord", area_sqm: 900, rooms: 0, bathrooms: 0, parking_spots: 0, featured: false },
  { title: "Vilă elegantă în Dorobanți", slug: "vila-eleganta-dorobanti", description: "Proprietate cu arhitectură clasică, camere înalte și poziție rară în centrul orașului.", price: 1250000, currency: "EUR", type: "VILLA", status: "PUBLISHED", city: "Bucuresti", county: "Bucuresti", address: "Dorobanți, stradă selectă", area_sqm: 420, rooms: 8, bathrooms: 6, parking_spots: 3, featured: true },
  { title: "Apartament 2 camere în Pipera", slug: "apartament-2-camere-pipera", description: "Apartament eficient, potrivit pentru locuit sau investiție, aproape de birouri și școli.", price: 149000, currency: "EUR", type: "APARTMENT", status: "PUBLISHED", city: "Pipera", county: "Ilfov", address: "Pipera, ansamblu nou", area_sqm: 61, rooms: 2, bathrooms: 1, parking_spots: 1, featured: false },
  { title: "Casă cu curte în Corbeanca", slug: "casa-cu-curte-corbeanca", description: "Casă bine proporționată, cu zonă de zi deschisă și curte ușor de întreținut.", price: 295000, currency: "EUR", type: "HOUSE", status: "PUBLISHED", city: "Corbeanca", county: "Ilfov", address: "Corbeanca, aproape de lac", area_sqm: 180, rooms: 5, bathrooms: 3, parking_spots: 2, featured: false },
  { title: "Spațiu comercial la parter în București", slug: "spatiu-comercial-parter-bucuresti", description: "Spațiu potrivit pentru servicii sau retail, cu vizibilitate bună și acces direct din stradă.", price: 260000, currency: "EUR", type: "COMMERCIAL", status: "PUBLISHED", city: "Bucuresti", county: "Bucuresti", address: "Zona centrală, parter stradal", area_sqm: 108, rooms: 3, bathrooms: 2, parking_spots: 0, featured: false },
  { title: "Vilă premium în Pipera", slug: "vila-premium-pipera", description: "Vilă modernă cu finisaje bune, compartimentare clară și acces rapid către școli internaționale.", price: 740000, currency: "EUR", type: "VILLA", status: "PUBLISHED", city: "Pipera", county: "Ilfov", address: "Pipera, zonă rezidențială", area_sqm: 310, rooms: 7, bathrooms: 5, parking_spots: 2, featured: true },
  { title: "Apartament luminos în Dorobanți", slug: "apartament-luminos-dorobanti", description: "Apartament cu lumină naturală bună, compartimentare practică și adresă solidă.", price: 198000, currency: "EUR", type: "APARTMENT", status: "PUBLISHED", city: "Bucuresti", county: "Bucuresti", address: "Dorobanți, aproape de ambasade", area_sqm: 74, rooms: 3, bathrooms: 2, parking_spots: 1, featured: false },
  { title: "Casă duplex în Băneasa", slug: "casa-duplex-baneasa", description: "Duplex cu acces bun spre nord, potrivit pentru familie care vrea spațiu și confort.", price: 410000, currency: "EUR", type: "HOUSE", status: "PUBLISHED", city: "Bucuresti", county: "Bucuresti", address: "Băneasa, zonă liniștită", area_sqm: 195, rooms: 5, bathrooms: 3, parking_spots: 2, featured: false },
  { title: "Teren pentru casă în Corbeanca", slug: "teren-pentru-casa-corbeanca", description: "Teren compact, bun pentru casă individuală, cu vecinătăți deja dezvoltate.", price: 98000, currency: "EUR", type: "LAND", status: "PUBLISHED", city: "Corbeanca", county: "Ilfov", address: "Corbeanca, lot de casă", area_sqm: 520, rooms: 0, bathrooms: 0, parking_spots: 0, featured: false },
  { title: "Apartament 4 camere în Aviatorilor", slug: "apartament-4-camere-aviatorilor", description: "Apartament mare, potrivit pentru familie, cu poziție excelentă și acces rapid la parc.", price: 465000, currency: "EUR", type: "APARTMENT", status: "PUBLISHED", city: "Bucuresti", county: "Bucuresti", address: "Aviatorilor, lângă parc", area_sqm: 128, rooms: 4, bathrooms: 3, parking_spots: 1, featured: true },
  { title: "Vilă minimalistă în Corbeanca", slug: "vila-minimalista-corbeanca", description: "Casă nouă, cu design simplu, ferestre mari și finisaje curate.", price: 348000, currency: "EUR", type: "VILLA", status: "PUBLISHED", city: "Corbeanca", county: "Ilfov", address: "Corbeanca, cartier nou", area_sqm: 198, rooms: 5, bathrooms: 4, parking_spots: 2, featured: false },
  { title: "Apartament de investiție în București", slug: "apartament-investitie-bucuresti", description: "O alegere bună pentru randament, într-o zonă cu cerere constantă.", price: 132000, currency: "EUR", type: "APARTMENT", status: "PUBLISHED", city: "Bucuresti", county: "Bucuresti", address: "București, zonă conectată", area_sqm: 58, rooms: 2, bathrooms: 1, parking_spots: 0, featured: false },
  { title: "Casă cu 6 camere în Pipera", slug: "casa-6-camere-pipera", description: "Casă spațioasă, bună pentru familie numeroasă sau pentru lucru de acasă.", price: 590000, currency: "EUR", type: "HOUSE", status: "PUBLISHED", city: "Pipera", county: "Ilfov", address: "Pipera, aproape de rond", area_sqm: 280, rooms: 6, bathrooms: 5, parking_spots: 2, featured: true },
  { title: "Spațiu birouri în Dorobanți", slug: "spatiu-birouri-dorobanti", description: "Spațiu potrivit pentru firmă mică sau cabinet, cu adresă ușor de găsit.", price: 215000, currency: "EUR", type: "COMMERCIAL", status: "PUBLISHED", city: "Bucuresti", county: "Bucuresti", address: "Dorobanți, zonă comercială", area_sqm: 84, rooms: 4, bathrooms: 2, parking_spots: 0, featured: false },
  { title: "Teren mare în Ilfov", slug: "teren-mare-ilfov", description: "Teren generos, util pentru proiect rezidențial sau parcelare etapizată.", price: 560000, currency: "EUR", type: "LAND", status: "PUBLISHED", city: "Corbeanca", county: "Ilfov", address: "Ilfov, lângă zona rezidențială", area_sqm: 2400, rooms: 0, bathrooms: 0, parking_spots: 0, featured: false },
]


export async function seedPropertiesClient() {
  const key = serviceKey || key
  return { keyPresent: Boolean(key), count: propertiesSeed.length }
}
