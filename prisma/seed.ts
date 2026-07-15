import { PrismaClient } from '@prisma/client'

const db = new PrismaClient({ log: [] })

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
  'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await db.propertyAnalytics.deleteMany()
  await db.marketData.deleteMany()
  await db.property.deleteMany()
  await db.zone.deleteMany()
  console.log('✅ Cleared existing data')

  // ── ZONES ──────────────────────────────────────────────────────────────
  const zonesData = [
    {
      name: 'Dorobanti',
      slug: 'dorobanti',
      sector: 'Sector 1',
      description: 'Una dintre cele mai prestigioase zone rezidentiale din Bucuresti, cunoscuta pentru arhitectura interbelica, vilele elegante si apropierea de Parcul Kiseleff. Zona ofera un stil de viata exclusivist cu restaurante fine, boutique-uri si scoli internationale.',
      avgPriceSqm: 3800,
      demand: 'Foarte Ridicata',
      popularFor: '["Vile interbelice","Apartamente de lux","Restaurante fine","Scoli internationale"]',
      sortOrder: 1,
    },
    {
      name: 'Floreasca',
      slug: 'floreasca',
      sector: 'Sector 1',
      description: 'Zona moderna de nord cu Parcul Floreasca si Lacul Floreasca. Recunoscuta pentru cladirile de birouri moderne, complexele rezidentiale noi si accesul excelent la infrastructura urbana.',
      avgPriceSqm: 3200,
      demand: 'Ridicata',
      popularFor: '["Apartamente noi","Cladiri de birouri","Parcul Floreasca","Life style modern"]',
      sortOrder: 2,
    },
    {
      name: 'Pipera',
      slug: 'pipera',
      sector: 'Sector 1',
      description: 'Zona de business si rezidentiala in plina dezvoltare, cu multiple complexe rezidentiale noi si parcuri de afaceri. Populara printre expati si profesionistii din IT.',
      avgPriceSqm: 2400,
      demand: 'Ridicata',
      popularFor: '["Complexuri rezidentiale noi","Parcuri de business","Comunitate internationala","Acces Aeroport OTP"]',
      sortOrder: 3,
    },
    {
      name: 'Baneasa',
      slug: 'baneasa',
      sector: 'Sector 1',
      description: 'Zona verde si linistita din nordul Bucurestului, cu Parcul Baneasa si Aeroportul Baneasa. Ofera o atmosfera suburban-a cu acces rapid la centrul orasului.',
      avgPriceSqm: 2600,
      demand: 'Moderata',
      popularFor: '["Case si vile","Spatiu verde","Aeroport Baneasa","Golf"]',
      sortOrder: 4,
    },
    {
      name: 'Aviatorilor',
      slug: 'aviatorilor',
      sector: 'Sector 1',
      description: 'Zona central-premium cu arhitectura moderna si clasica, langa Arcul de Triumf. Recunoscuta pentru ambassade, restaurante de lux si acces exceptional la transportul public.',
      avgPriceSqm: 3500,
      demand: 'Foarte Ridicata',
      popularFor: '["Apartamente premium","Ambassade","Arcul de Triumf","Restaurante de lux"]',
      sortOrder: 5,
    },
    {
      name: 'Herestrau',
      slug: 'herestrau',
      sector: 'Sector 1',
      description: 'Zona exclusivista din jurul Parcului Herestrau, cu unele dintre cele mai scumpe proprietati din Bucuresti. Lacul Herestrau ofera un cadru natural unic in inima orasului.',
      avgPriceSqm: 4200,
      demand: 'Foarte Ridicata',
      popularFor: '["Vile de lux","Parcul Herestrau","Yachting","Proprietati exclusive"]',
      sortOrder: 6,
    },
    {
      name: 'Victoriei',
      slug: 'victoriei',
      sector: 'Sector 1',
      description: 'Zona centrala in jurul Pietei Victoriei, hub politic si comercial. Excelenta conectivitate cu metroul si transportul in comun, cu amestec de cladiri istorice si moderne.',
      avgPriceSqm: 3000,
      demand: 'Ridicata',
      popularFor: '["Apartamente centrale","Metrou","Piata Victoriei","Institutii guvernamentale"]',
      sortOrder: 7,
    },
    {
      name: 'Unirii',
      slug: 'unirii',
      sector: 'Sector 3',
      description: 'Zona inima Bucurestilor, cu Piata Unirii, centrul comercial si viața de noapte. Zona cu cea mai mare densitate de restaurante, cafenele si magazine din oras.',
      avgPriceSqm: 2800,
      demand: 'Ridicata',
      popularFor: '["Viața de noapte","Shopping","Centru istoric","Metrou"]',
      sortOrder: 8,
    },
    {
      name: 'Cotroceni',
      slug: 'cotroceni',
      sector: 'Sector 6',
      description: 'Zona rezidentiala eleganta cu Parcul Cotroceni si Palatul Cotroceni. Cunoscuta pentru atmosfera relaxata, strazi linistite si universitati prestigioase.',
      avgPriceSqm: 2600,
      demand: 'Moderata',
      popularFor: '["Parcul Cotroceni","Universitati","Atmosfera rezidentiala","Palatul Cotroceni"]',
      sortOrder: 9,
    },
    {
      name: 'Militari',
      slug: 'militari',
      sector: 'Sector 6',
      description: 'Zona rezidentiala cu preturi accesibile din vestul Bucurestilor. Excelenta infrastructura de transport, scoli si centre comerciale, populara printre familii.',
      avgPriceSqm: 1900,
      demand: 'Moderata',
      popularFor: '["Preturi accesibile","Familii","Transport in comun","Parcuri"]',
      sortOrder: 10,
    },
  ]

  const zones = await Promise.all(
    zonesData.map((z) => db.zone.create({ data: z }))
  )
  console.log(`✅ Created ${zones.length} zones`)

  // ── PROPERTIES ─────────────────────────────────────────────────────────
  const propertiesData = [
    // Dorobanti (3)
    {
      title: 'Apartament Luxury 4 Camere cu Vedere spre Parc',
      slug: 'apartament-luxury-4-camere-dorobanti',
      description: 'Apartament exceptional de 4 camere situat intr-o cladire interbelica restaurata, cu vedere panoramica spre Parcul Kiseleff. Finisaje premium: parchet de lemn masiv, geamuri termopan cu profil subtire, sistem smart home integrat. Bucatarie deschisa cu echipamente Bosch si Miele.',
      type: 'APARTMENT',
      transaction: 'SALE',
      price: 485000,
      areaSqm: 128,
      rooms: 4,
      bathrooms: 2,
      floor: 3,
      yearBuilt: 1938,
      address: 'Strada Dr. Gheorghe Marinescu 15, Bucuresti',
      zone: 'Dorobanti',
      sector: 'Sector 1',
      lat: 44.4601,
      lng: 26.0852,
      status: 'PUBLISHED',
      featured: true,
      coverUrl: COVER_IMAGES[0],
      galleryUrls: JSON.stringify([COVER_IMAGES[0], COVER_IMAGES[1], COVER_IMAGES[2]]),
    },
    {
      title: 'Vila Interbelica cu Gradina 500mp',
      slug: 'vila-interbelica-dorobanti',
      description: 'Vila interbelica de exceptie, cu o gradina spectaculoasa de 500mp si arhitectura originala pastrata cu grija. 6 camere spatioase, tavan inalt de 3.2m, grinzi decorative din lemn. Renovare completa in 2022 cu materiale de cea mai inalta calitate.',
      type: 'VILLA',
      transaction: 'SALE',
      price: 1250000,
      areaSqm: 320,
      rooms: 6,
      bathrooms: 3,
      floor: null,
      yearBuilt: 1935,
      address: 'Strada General Ioan Culcer 22, Bucuresti',
      zone: 'Dorobanti',
      sector: 'Sector 1',
      lat: 44.4580,
      lng: 26.0820,
      status: 'PUBLISHED',
      featured: true,
      coverUrl: COVER_IMAGES[4],
      galleryUrls: JSON.stringify([COVER_IMAGES[4], COVER_IMAGES[5], COVER_IMAGES[6]]),
    },
    {
      title: 'Apartament 2 Camere Renovat Central',
      slug: 'apartament-2-camere-dorobanti',
      description: 'Apartament de 2 camere complet renovat in 2024, situat la etajul 4 intr-un imobil cu lift. Design modern, bucatarie echipata complet, baie cu cabina de dus walk-in. Proximiate imediata la transport public si restaurante.',
      type: 'APARTMENT',
      transaction: 'RENT',
      price: 1200,
      areaSqm: 65,
      rooms: 2,
      bathrooms: 1,
      floor: 4,
      yearBuilt: 1975,
      address: 'Bulevardul Aviatorilor 45, Bucuresti',
      zone: 'Dorobanti',
      sector: 'Sector 1',
      lat: 44.4615,
      lng: 26.0835,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[2],
      galleryUrls: JSON.stringify([COVER_IMAGES[2], COVER_IMAGES[7]]),
    },

    // Floreasca (3)
    {
      title: 'Apartament Nou 3 Camere cu Balcon Mare',
      slug: 'apartament-nou-3-camere-floreasca',
      description: 'Apartament nou, predare in 2024, intr-un complex rezidential modern cu piscina si fitness. 3 camere luminoase cu balcon inchis de 12mp, finisaje premium si eficienta energetica A+. Parcare subterana inclusa.',
      type: 'APARTMENT',
      transaction: 'SALE',
      price: 295000,
      areaSqm: 92,
      rooms: 3,
      bathrooms: 2,
      floor: 7,
      yearBuilt: 2024,
      address: 'Strada Daniela Couteanu 10, Bucuresti',
      zone: 'Floreasca',
      sector: 'Sector 1',
      lat: 44.4645,
      lng: 26.0875,
      status: 'PUBLISHED',
      featured: true,
      coverUrl: COVER_IMAGES[1],
      galleryUrls: JSON.stringify([COVER_IMAGES[1], COVER_IMAGES[3], COVER_IMAGES[5]]),
    },
    {
      title: 'Penthouse Panoramic cu Terasa pe Acoperis',
      slug: 'penthouse-panoramic-floreasca',
      description: 'Penthouse exclusiv cu terasa de 80mp si vedere spectaculoasa spre Lacul Floreasca. 5 camere, finisaje de lux, sistem de aer conditionat centralizat, home cinema. Doua locuri de parcare subterane.',
      type: 'APARTMENT',
      transaction: 'SALE',
      price: 685000,
      areaSqm: 185,
      rooms: 5,
      bathrooms: 3,
      floor: 12,
      yearBuilt: 2023,
      address: 'Bulevardul Barbu Vacarescu 22, Bucuresti',
      zone: 'Floreasca',
      sector: 'Sector 1',
      lat: 44.4630,
      lng: 26.0910,
      status: 'PUBLISHED',
      featured: true,
      coverUrl: COVER_IMAGES[5],
      galleryUrls: JSON.stringify([COVER_IMAGES[5], COVER_IMAGES[0], COVER_IMAGES[4]]),
    },
    {
      title: 'Apartament 2 Camere Inchiriere Lunara',
      slug: 'apartament-2-camere-inchiriere-floreasca',
      description: 'Apartament modern de 2 camere, mobilat si utilat complet, ideal pentru profesionisti. Complex rezidential cu paza 24/7, acces la piscina si sala de sport. Metrou la 5 minute distanta.',
      type: 'APARTMENT',
      transaction: 'RENT',
      price: 950,
      areaSqm: 58,
      rooms: 2,
      bathrooms: 1,
      floor: 5,
      yearBuilt: 2022,
      address: 'Strada C.A. Rosetti 31, Bucuresti',
      zone: 'Floreasca',
      sector: 'Sector 1',
      lat: 44.4650,
      lng: 26.0890,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[3],
      galleryUrls: JSON.stringify([COVER_IMAGES[3], COVER_IMAGES[7]]),
    },

    // Pipera (3)
    {
      title: 'Casa cu 4 Camere si Curte',
      slug: 'casa-4-camere-pipera',
      description: 'Casa moderna de 4 camere cu o curte frumos amenajata de 200mp. Constructie din 2021, izolare termica excelenta, sistem de incalzire in pardoseala. Garaj dublu si loc de parcare suplimentar.',
      type: 'HOUSE',
      transaction: 'SALE',
      price: 265000,
      areaSqm: 145,
      rooms: 4,
      bathrooms: 2,
      floor: null,
      yearBuilt: 2021,
      address: 'Strada Erou Iancu Nicolae 45, Bucuresti',
      zone: 'Pipera',
      sector: 'Sector 1',
      lat: 44.4850,
      lng: 26.1050,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[6],
      galleryUrls: JSON.stringify([COVER_IMAGES[6], COVER_IMAGES[2], COVER_IMAGES[7]]),
    },
    {
      title: 'Apartament 3 Camere Complex Premium',
      slug: 'apartament-3-camere-pipera',
      description: 'Apartament spatios de 3 camere intr-unul dintre cele mai noi complexuri din Pipera. Finisaje moderne, bucatarie open-space, balcon de 8mp. Parcare subterana si boxa de depozitare incluse.',
      type: 'APARTMENT',
      transaction: 'SALE',
      price: 215000,
      areaSqm: 85,
      rooms: 3,
      bathrooms: 2,
      floor: 4,
      yearBuilt: 2023,
      address: 'Soseaua Pipera 56, Bucuresti',
      zone: 'Pipera',
      sector: 'Sector 1',
      lat: 44.4830,
      lng: 26.1000,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[1],
      galleryUrls: JSON.stringify([COVER_IMAGES[1], COVER_IMAGES[4]]),
    },
    {
      title: 'Apartament Studio Inchiriere Pipera',
      slug: 'apartament-studio-inchiriere-pipera',
      description: 'Studio modern mobilat si utilat, ideal pentru o persoana. Complex rezidential cu facilitati complete, acces direct la transportul catre centru. Internet fibra inclus.',
      type: 'APARTMENT',
      transaction: 'RENT',
      price: 550,
      areaSqm: 38,
      rooms: 1,
      bathrooms: 1,
      floor: 3,
      yearBuilt: 2022,
      address: 'Strada Dumitru Petrascu 18, Bucuresti',
      zone: 'Pipera',
      sector: 'Sector 1',
      lat: 44.4860,
      lng: 26.1020,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[7],
      galleryUrls: JSON.stringify([COVER_IMAGES[7]]),
    },

    // Baneasa (2)
    {
      title: 'Vila cu Piscina si Teren Sportiv',
      slug: 'vila-cu-piscina-baneasa',
      description: 'Vila impunatoare cu piscina interioara incalzita si teren de sport. 7 camere, bucatarie profesionala, pivnita. Teren de 800mp cu gradina peisagistica. Sistem de securitate complet.',
      type: 'VILLA',
      transaction: 'SALE',
      price: 890000,
      areaSqm: 380,
      rooms: 7,
      bathrooms: 4,
      floor: null,
      yearBuilt: 2019,
      address: 'Soseaua Baneasa 88, Bucuresti',
      zone: 'Baneasa',
      sector: 'Sector 1',
      lat: 44.4950,
      lng: 26.0850,
      status: 'PUBLISHED',
      featured: true,
      coverUrl: COVER_IMAGES[4],
      galleryUrls: JSON.stringify([COVER_IMAGES[4], COVER_IMAGES[0], COVER_IMAGES[5], COVER_IMAGES[6]]),
    },
    {
      title: 'Teren Intravilan 600mp Baneasa',
      slug: 'teren-intravilan-baneasa',
      description: 'Teren intravilan cu o suprafata de 600mp, deschis la drum, ideal pentru constructie casa. Tuturile asigurate, utilitatile la limita proprietatii. Zona rezidentiala linistita.',
      type: 'LAND',
      transaction: 'SALE',
      price: 180000,
      areaSqm: 600,
      rooms: 0,
      bathrooms: 0,
      floor: null,
      yearBuilt: null,
      address: 'Strada Alexandru Serbanescu 32, Bucuresti',
      zone: 'Baneasa',
      sector: 'Sector 1',
      lat: 44.4920,
      lng: 26.0880,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[6],
      galleryUrls: JSON.stringify([COVER_IMAGES[6]]),
    },

    // Aviatorilor (2)
    {
      title: 'Apartament Elegant 3 Camere Etaj Inalt',
      slug: 'apartament-elegant-3-camere-aviatorilor',
      description: 'Apartament elegant de 3 camere situat la etajul 8, cu vedere libera spre Arcul de Triumf. Renovat complet in 2023: parchet stejar, bucatarie cu insula, baie cu cada freestanding. Un loc de parcare.',
      type: 'APARTMENT',
      transaction: 'SALE',
      price: 365000,
      areaSqm: 105,
      rooms: 3,
      bathrooms: 2,
      floor: 8,
      yearBuilt: 1980,
      address: 'Bulevardul Aviatorilor 78, Bucuresti',
      zone: 'Aviatorilor',
      sector: 'Sector 1',
      lat: 44.4670,
      lng: 26.0800,
      status: 'PUBLISHED',
      featured: true,
      coverUrl: COVER_IMAGES[0],
      galleryUrls: JSON.stringify([COVER_IMAGES[0], COVER_IMAGES[1], COVER_IMAGES[2]]),
    },
    {
      title: 'Spatiu Comercial Stradal Aviatorilor',
      slug: 'spatiu-comercial-aviatorilor',
      description: 'Spatiu comercial excelent pe bulevardul principal, cu vitrina mare si vizibilitate maxima. Ideal pentru restaurant, cafenea sau showroom. Doua niveluri, bucatarie amenajata, grup sanitar.',
      type: 'COMMERCIAL',
      transaction: 'RENT',
      price: 3500,
      areaSqm: 120,
      rooms: 3,
      bathrooms: 2,
      floor: null,
      yearBuilt: 2010,
      address: 'Bulevardul Aviatorilor 32, Bucuresti',
      zone: 'Aviatorilor',
      sector: 'Sector 1',
      lat: 44.4660,
      lng: 26.0815,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[3],
      galleryUrls: JSON.stringify([COVER_IMAGES[3], COVER_IMAGES[5]]),
    },

    // Herestrau (2)
    {
      title: 'Vila de Lux pe Malul Lacului Herestrau',
      slug: 'vila-de-lux-herestrau',
      description: 'Vila de lux cu acces direct la Lacul Herestrau. Finisaje exceptionale: marmura italiana, lemn nobil, sistem home automation complet. Piscina privata, port-cochere, terasa cu bar.',
      type: 'VILLA',
      transaction: 'SALE',
      price: 2100000,
      areaSqm: 450,
      rooms: 8,
      bathrooms: 5,
      floor: null,
      yearBuilt: 2020,
      address: 'Strada Alexandru I. Cuza 22, Bucuresti',
      zone: 'Herestrau',
      sector: 'Sector 1',
      lat: 44.4700,
      lng: 26.0780,
      status: 'PUBLISHED',
      featured: true,
      coverUrl: COVER_IMAGES[4],
      galleryUrls: JSON.stringify([COVER_IMAGES[4], COVER_IMAGES[0], COVER_IMAGES[5], COVER_IMAGES[6], COVER_IMAGES[7]]),
    },
    {
      title: 'Apartament 3 Camere Vedere Lac',
      slug: 'apartament-3-camere-vedere-lac-herestrau',
      description: 'Apartament superb de 3 camere cu vedere directa la Lacul Herestrau. Bloc premium cu servicii de concierge, piscina si fitness. Design modern, terasa de 15mp.',
      type: 'APARTMENT',
      transaction: 'SALE',
      price: 520000,
      areaSqm: 115,
      rooms: 3,
      bathrooms: 2,
      floor: 6,
      yearBuilt: 2022,
      address: 'Soseaua Kiseleff 5, Bucuresti',
      zone: 'Herestrau',
      sector: 'Sector 1',
      lat: 44.4690,
      lng: 26.0795,
      status: 'PUBLISHED',
      featured: true,
      coverUrl: COVER_IMAGES[5],
      galleryUrls: JSON.stringify([COVER_IMAGES[5], COVER_IMAGES[1], COVER_IMAGES[3]]),
    },

    // Victoriei (2)
    {
      title: 'Apartament Central 2 Camere cu Metrou',
      slug: 'apartament-central-2-camere-victoriei',
      description: 'Apartament central de 2 camere situat la 2 minute de metrou Piata Victoriei. Renovat complet, mobilat modern, bucatarie echipata. Ideal pentru investitie sau locuinta principala.',
      type: 'APARTMENT',
      transaction: 'SALE',
      price: 195000,
      areaSqm: 62,
      rooms: 2,
      bathrooms: 1,
      floor: 2,
      yearBuilt: 1972,
      address: 'Strada Lascar Catargiu 18, Bucuresti',
      zone: 'Victoriei',
      sector: 'Sector 1',
      lat: 44.4620,
      lng: 26.0970,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[2],
      galleryUrls: JSON.stringify([COVER_IMAGES[2], COVER_IMAGES[7]]),
    },
    {
      title: 'Apartament 4 Camere Birou/Rezidential',
      slug: 'apartament-4-camere-birou-victoriei',
      description: 'Spacious 4-room apartment perfect for dual use as office and residence. Located steps from government buildings and metro. High ceilings, 2 balconies, recent renovation.',
      type: 'APARTMENT',
      transaction: 'RENT',
      price: 1800,
      areaSqm: 110,
      rooms: 4,
      bathrooms: 2,
      floor: 5,
      yearBuilt: 1968,
      address: 'Bulevardul Gheorghe Magheru 28, Bucuresti',
      zone: 'Victoriei',
      sector: 'Sector 1',
      lat: 44.4610,
      lng: 26.0960,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[0],
      galleryUrls: JSON.stringify([COVER_IMAGES[0], COVER_IMAGES[3]]),
    },

    // Unirii (3)
    {
      title: 'Apartament 2 Camere Centru Vechi',
      slug: 'apartament-2-camere-centru-vechi-unirii',
      description: 'Apartament de 2 camere in inima Centrului Vechi, la etajul 1 cu vedere pe strada. Atmosfera unica, la pas de restaurante, cluburi si obiective turistice. Ideal pentru inchiriere pe Airbnb.',
      type: 'APARTMENT',
      transaction: 'SALE',
      price: 175000,
      areaSqm: 55,
      rooms: 2,
      bathrooms: 1,
      floor: 1,
      yearBuilt: 1930,
      address: 'Strada Smardan 12, Bucuresti',
      zone: 'Unirii',
      sector: 'Sector 3',
      lat: 44.4260,
      lng: 26.1025,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[3],
      galleryUrls: JSON.stringify([COVER_IMAGES[3], COVER_IMAGES[5]]),
    },
    {
      title: 'Garsoniera Moderna Inchiriere Unirii',
      slug: 'garsoniera-moderna-inchiriere-unirii',
      description: 'Garsoniera moderna si eficienta, perfect mobilata, la 3 minute de metrou Unirii. Include tot utilajele: masina de spalat, frigider, aer conditionat. Ideala pentru studenti sau tineri profesionisti.',
      type: 'APARTMENT',
      transaction: 'RENT',
      price: 480,
      areaSqm: 32,
      rooms: 1,
      bathrooms: 1,
      floor: 6,
      yearBuilt: 2018,
      address: 'Bulevardul Ion Mihalache 9, Bucuresti',
      zone: 'Unirii',
      sector: 'Sector 3',
      lat: 44.4280,
      lng: 26.1005,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[7],
      galleryUrls: JSON.stringify([COVER_IMAGES[7]]),
    },
    {
      title: 'Spatiu Comercial Colteanu Unirii',
      slug: 'spatiu-comercial-unirii',
      description: 'Spatiu comercial cu vitrina spectaculoasa pe strada principala. Suprafata deschisa, fara piloni, inaltime de 4m. Util pentru retail, farma, bancă sau fast-food. Locuri de parcare in fata.',
      type: 'COMMERCIAL',
      transaction: 'SALE',
      price: 420000,
      areaSqm: 180,
      rooms: 1,
      bathrooms: 2,
      floor: null,
      yearBuilt: 2005,
      address: 'Bulevardul Colentina 15, Bucuresti',
      zone: 'Unirii',
      sector: 'Sector 3',
      lat: 44.4300,
      lng: 26.1050,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[1],
      galleryUrls: JSON.stringify([COVER_IMAGES[1], COVER_IMAGES[4]]),
    },

    // Cotroceni (2)
    {
      title: 'Apartament 3 Camere langa Parcul Cotroceni',
      slug: 'apartament-3-camere-cotroceni',
      description: 'Apartament frumos de 3 camere intr-o zona linistita, la 3 minute de Parcul Cotroceni. Renovat cu gust, parchet lemn, bucatarie moderna, geamuri termopan. Etaj intermediar, bloc cu lift.',
      type: 'APARTMENT',
      transaction: 'SALE',
      price: 215000,
      areaSqm: 78,
      rooms: 3,
      bathrooms: 1,
      floor: 3,
      yearBuilt: 1978,
      address: 'Strada Doctor Staicovici 14, Bucuresti',
      zone: 'Cotroceni',
      sector: 'Sector 6',
      lat: 44.4350,
      lng: 26.0750,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[2],
      galleryUrls: JSON.stringify([COVER_IMAGES[2], COVER_IMAGES[0], COVER_IMAGES[6]]),
    },
    {
      title: 'Casa Individuala 3 Camere Cotroceni',
      slug: 'casa-individuala-cotroceni',
      description: 'Casa individuala cu 3 camere si gradina de 150mp. Constructie solida din caramida, acoperis nou, izolatie termica adaugata. Bucatarie spatioasa, terasa acoperita.',
      type: 'HOUSE',
      transaction: 'SALE',
      price: 245000,
      areaSqm: 110,
      rooms: 3,
      bathrooms: 2,
      floor: null,
      yearBuilt: 2005,
      address: 'Strada Sabinelor 28, Bucuresti',
      zone: 'Cotroceni',
      sector: 'Sector 6',
      lat: 44.4330,
      lng: 26.0720,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[6],
      galleryUrls: JSON.stringify([COVER_IMAGES[6], COVER_IMAGES[4]]),
    },

    // Militari (2)
    {
      title: 'Apartament 3 Camere Militari Residence',
      slug: 'apartament-3-camere-militari',
      description: 'Apartament de 3 camere intr-un ansamblu rezidential modern din Militari. Finisaje bune, parcare subterana, spatii verzi. Metrou la 8 minute, mall la 5 minute.',
      type: 'APARTMENT',
      transaction: 'SALE',
      price: 148000,
      areaSqm: 72,
      rooms: 3,
      bathrooms: 1,
      floor: 4,
      yearBuilt: 2021,
      address: 'Bulevardul Iuliu Maniu 15, Bucuresti',
      zone: 'Militari',
      sector: 'Sector 6',
      lat: 44.4310,
      lng: 26.0450,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[7],
      galleryUrls: JSON.stringify([COVER_IMAGES[7], COVER_IMAGES[1]]),
    },
    {
      title: 'Apartament 2 Camere First Rent Militari',
      slug: 'apartament-2-camere-first-rent-militari',
      description: 'Apartament de 2 camere, mobilat complet, gata de locuit. Ansamblu nou cu paza, loc de joaca pentru copii si parcari. Raport excelent pret/calitate.',
      type: 'APARTMENT',
      transaction: 'RENT',
      price: 600,
      areaSqm: 55,
      rooms: 2,
      bathrooms: 1,
      floor: 2,
      yearBuilt: 2023,
      address: 'Soseaua Virtutii 44, Bucuresti',
      zone: 'Militari',
      sector: 'Sector 6',
      lat: 44.4285,
      lng: 26.0430,
      status: 'PUBLISHED',
      featured: false,
      coverUrl: COVER_IMAGES[3],
      galleryUrls: JSON.stringify([COVER_IMAGES[3], COVER_IMAGES[5]]),
    },
  ]

  const properties = await Promise.all(
    propertiesData.map((p) => db.property.create({
      data: {
        ...p,
        pricePerSqm: p.areaSqm > 0 ? Math.round((p.price / p.areaSqm) * 100) / 100 : null,
      },
    }))
  )
  console.log(`✅ Created ${properties.length} properties`)

  // ── PROPERTY ANALYTICS ────────────────────────────────────────────────
  // Generate 12 weeks of analytics data (2026-W16 to 2026-W27)
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const weekNum = 16 + i
    return `2026-W${String(weekNum).padStart(2, '0')}`
  })

  const analyticsData: {
    propertyId: string
    week: string
    views: number
    inquiries: number
    saves: number
  }[] = []

  for (const property of properties) {
    const isFeatured = property.featured
    const baseViews = isFeatured ? 150 : 60
    const baseInquiries = isFeatured ? 8 : 3
    const baseSaves = isFeatured ? 15 : 5

    for (const week of weeks) {
      // Add slight upward trend over weeks
      const weekIndex = weeks.indexOf(week)
      const trendMultiplier = 1 + weekIndex * 0.05

      analyticsData.push({
        propertyId: property.id,
        week,
        views: Math.round(baseViews * trendMultiplier + Math.random() * 40 - 20),
        inquiries: Math.round(baseInquiries * trendMultiplier + Math.random() * 4 - 2),
        saves: Math.round(baseSaves * trendMultiplier + Math.random() * 6 - 3),
      })
    }
  }

  // Insert in batches to avoid issues
  const batchSize = 50
  for (let i = 0; i < analyticsData.length; i += batchSize) {
    const batch = analyticsData.slice(i, i + batchSize)
    await Promise.all(
      batch.map((a) => db.propertyAnalytics.create({ data: a }))
    )
  }
  console.log(`✅ Created ${analyticsData.length} property analytics records`)

  // ── MARKET DATA ───────────────────────────────────────────────────────
  const zonePriceMap: Record<string, Record<string, number>> = {
    Dorobanti: { APARTMENT: 3800, HOUSE: 4200, VILLA: 4500, LAND: 1800, COMMERCIAL: 3500 },
    Floreasca: { APARTMENT: 3200, HOUSE: 3600, VILLA: 4000, LAND: 1600, COMMERCIAL: 3000 },
    Pipera: { APARTMENT: 2500, HOUSE: 2800, VILLA: 3200, LAND: 1200, COMMERCIAL: 2200 },
    Baneasa: { APARTMENT: 2600, HOUSE: 2900, VILLA: 3800, LAND: 1400, COMMERCIAL: 2000 },
    Aviatorilor: { APARTMENT: 3500, HOUSE: 4000, VILLA: 4200, LAND: 1700, COMMERCIAL: 3200 },
    Herestrau: { APARTMENT: 4200, HOUSE: 4800, VILLA: 5500, LAND: 2200, COMMERCIAL: 3800 },
    Victoriei: { APARTMENT: 3000, HOUSE: 3200, VILLA: 3600, LAND: 1500, COMMERCIAL: 2800 },
    Unirii: { APARTMENT: 2800, HOUSE: 3000, VILLA: 3400, LAND: 1400, COMMERCIAL: 3000 },
    Cotroceni: { APARTMENT: 2600, HOUSE: 2900, VILLA: 3300, LAND: 1300, COMMERCIAL: 2400 },
    Militari: { APARTMENT: 1900, HOUSE: 2200, VILLA: 2600, LAND: 900, COMMERCIAL: 1600 },
  }

  const zoneAreaMap: Record<string, Record<string, number>> = {
    Dorobanti: { APARTMENT: 95, HOUSE: 180, VILLA: 300, LAND: 500, COMMERCIAL: 120 },
    Floreasca: { APARTMENT: 88, HOUSE: 160, VILLA: 280, LAND: 450, COMMERCIAL: 130 },
    Pipera: { APARTMENT: 75, HOUSE: 140, VILLA: 250, LAND: 400, COMMERCIAL: 110 },
    Baneasa: { APARTMENT: 80, HOUSE: 150, VILLA: 320, LAND: 600, COMMERCIAL: 100 },
    Aviatorilor: { APARTMENT: 90, HOUSE: 170, VILLA: 290, LAND: 480, COMMERCIAL: 125 },
    Herestrau: { APARTMENT: 110, HOUSE: 200, VILLA: 400, LAND: 700, COMMERCIAL: 150 },
    Victoriei: { APARTMENT: 82, HOUSE: 155, VILLA: 260, LAND: 420, COMMERCIAL: 115 },
    Unirii: { APARTMENT: 60, HOUSE: 130, VILLA: 240, LAND: 380, COMMERCIAL: 140 },
    Cotroceni: { APARTMENT: 72, HOUSE: 145, VILLA: 270, LAND: 400, COMMERCIAL: 105 },
    Militari: { APARTMENT: 65, HOUSE: 120, VILLA: 220, LAND: 350, COMMERCIAL: 95 },
  }

  const types = ['APARTMENT', 'HOUSE', 'VILLA', 'LAND', 'COMMERCIAL']
  const marketDataToCreate: {
    zone: string
    type: string
    avgPriceSqm: number
    avgAreaSqm: number
    totalListed: number
    soldCount: number
    week: string
  }[] = []

  for (const zone of zonesData) {
    for (const type of types) {
      const basePrice = zonePriceMap[zone.name]?.[type] ?? 2500
      const baseArea = zoneAreaMap[zone.name]?.[type] ?? 100
      const baseListed = type === 'APARTMENT' ? 25 : type === 'LAND' ? 8 : 10
      const baseSold = Math.round(baseListed * 0.3)

      for (const week of weeks) {
        const weekIndex = weeks.indexOf(week)
        // Add some seasonal variation and upward trend
        const trendMultiplier = 1 + weekIndex * 0.02
        const seasonalVariation = 1 + Math.sin(weekIndex * 0.5) * 0.05

        marketDataToCreate.push({
          zone: zone.name,
          type,
          avgPriceSqm: Math.round(basePrice * trendMultiplier * seasonalVariation + (Math.random() * 100 - 50)),
          avgAreaSqm: Math.round((baseArea + (Math.random() * 20 - 10)) * 10) / 10,
          totalListed: Math.max(1, Math.round(baseListed * (0.9 + Math.random() * 0.2))),
          soldCount: Math.max(0, Math.round(baseSold * (0.8 + Math.random() * 0.4))),
          week,
        })
      }
    }
  }

  // Insert in batches
  for (let i = 0; i < marketDataToCreate.length; i += batchSize) {
    const batch = marketDataToCreate.slice(i, i + batchSize)
    await Promise.all(
      batch.map((m) => db.marketData.create({ data: m }))
    )
  }
  console.log(`✅ Created ${marketDataToCreate.length} market data records`)

  // ── VERIFICATION ──────────────────────────────────────────────────────
  const propCount = await db.property.count()
  const zoneCount = await db.zone.count()
  const analyticsCount = await db.propertyAnalytics.count()
  const marketCount = await db.marketData.count()

  console.log('\n📊 Seeding complete! Summary:')
  console.log(`   Properties: ${propCount}`)
  console.log(`   Zones: ${zoneCount}`)
  console.log(`   Property Analytics: ${analyticsCount}`)
  console.log(`   Market Data: ${marketCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
