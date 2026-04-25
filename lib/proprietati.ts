export interface Proprietate {
  id: string
  titlu: string
  tip: 'apartament' | 'casa' | 'vila'
  tranzactie: 'vanzare' | 'inchiriere'
  pret: number
  suprafata: number
  camere: number
  bai: number
  zona: string
  adresa: string
  descriere: string
  imagineUrl: string
  galerie: string[]
  facilitati: string[]
  etaj?: number
  anConstructie?: number
}

export const proprietati: Proprietate[] = [
  {
    id: '1',
    titlu: 'Apartament de lux în Floreasca',
    tip: 'apartament',
    tranzactie: 'vanzare',
    pret: 185000,
    suprafata: 95,
    camere: 3,
    bai: 2,
    etaj: 4,
    anConstructie: 2021,
    zona: 'Floreasca',
    adresa: 'Str. Floreasca, nr. 24, Sector 1',
    descriere: 'Apartament superb cu finisaje premium, vedere panoramică, parcare subterană inclusă. Suprafață utilă 95 mp, living generos de 35 mp, 2 dormitoare, 2 băi și o terasă de 12 mp. Imobilul dispune de piscină, room-service și securitate 24/7.',
    imagineUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    galerie: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    ],
    facilitati: ['Parcare', 'Piscină', 'Securitate 24/7', 'Lift', 'AC', 'Terasă'],
  },
  {
    id: '2',
    titlu: 'Vilă exclusivistă în Băneasa',
    tip: 'vila',
    tranzactie: 'vanzare',
    pret: 750000,
    suprafata: 320,
    camere: 6,
    bai: 4,
    anConstructie: 2019,
    zona: 'Băneasa',
    adresa: 'Str. Pădurea Băneasa, nr. 8',
    descriere: 'Vilă de excepție cu piscină privată, grădină peisagistică și garaj dublu. Proiect arhitectural unic, materiale premium, smart home complet integrat. Acces direct în pădurea Băneasa.',
    imagineUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
    galerie: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    ],
    facilitati: ['Piscină privată', 'Grădină', 'Garaj dublu', 'Smart home', 'Saună', 'Home cinema'],
  },
  {
    id: '3',
    titlu: 'Apartament modern în Pipera',
    tip: 'apartament',
    tranzactie: 'inchiriere',
    pret: 900,
    suprafata: 65,
    camere: 2,
    bai: 1,
    etaj: 2,
    anConstructie: 2020,
    zona: 'Pipera',
    adresa: 'Bd. Pipera, nr. 12, Sector 2',
    descriere: 'Apartament complet mobilat și utilat, aproape de metrou și centrele de business din Pipera. Finisaje moderne, living open-space, parcare inclusă.',
    imagineUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    galerie: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    ],
    facilitati: ['Mobilat', 'Utilat', 'Parcare', 'Metrou aproape', 'AC'],
  },
  {
    id: '4',
    titlu: 'Casă cu grădină în Dorobanți',
    tip: 'casa',
    tranzactie: 'vanzare',
    pret: 420000,
    suprafata: 180,
    camere: 4,
    bai: 2,
    anConstructie: 1995,
    zona: 'Dorobanți',
    adresa: 'Str. Dorobanților, nr. 55, Sector 1',
    descriere: 'Casă tradițională renovată complet în 2022, cu grădină de 200mp și terasă acoperită. Zonă de liniște, 5 minute de Piața Dorobanților.',
    imagineUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
    galerie: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
    ],
    facilitati: ['Grădină 200mp', 'Garaj', 'Pivniță', 'Terasă acoperită'],
  },
  {
    id: '5',
    titlu: 'Penthouse în Aviatorilor',
    tip: 'apartament',
    tranzactie: 'inchiriere',
    pret: 3500,
    suprafata: 200,
    camere: 4,
    bai: 3,
    etaj: 10,
    anConstructie: 2018,
    zona: 'Aviatorilor',
    adresa: 'Bd. Aviatorilor, nr. 70, Sector 1',
    descriere: 'Penthouse spectaculos cu terasă de 80mp și vedere panoramică asupra Bucureștiului. Concierge 24h, spa privat, lift direct în apartament.',
    imagineUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    galerie: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    ],
    facilitati: ['Terasă 80mp', 'Concierge', 'Spa', 'Parcare dublă', 'Lift privat'],
  },
  {
    id: '6',
    titlu: 'Apartament 2 camere în Tineretului',
    tip: 'apartament',
    tranzactie: 'vanzare',
    pret: 98000,
    suprafata: 52,
    camere: 2,
    bai: 1,
    etaj: 5,
    anConstructie: 1985,
    zona: 'Tineretului',
    adresa: 'Str. Tineretului, nr. 33, Sector 4',
    descriere: 'Apartament renovat complet în 2024, vedere spre parc, stradă liniștită. Gresie și parchet nou, instalații refăcute integral.',
    imagineUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    galerie: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    ],
    facilitati: ['Renovat 2024', 'Vedere parc', 'Stradă liniștită'],
  },
]
