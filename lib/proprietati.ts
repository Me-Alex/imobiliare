export interface Proprietate {
  id: string
  titlu: string
  tip: 'apartament' | 'casa' | 'vila'
  tranzactie: 'vanzare' | 'inchiriere'
  pret: number
  suprafata: number
  camere: number
  zona: string
  adresa: string
  descriere: string
  imagineUrl: string
  facilitati: string[]
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
    zona: 'Floreasca',
    adresa: 'Str. Floreasca, nr. 24, Sector 1',
    descriere: 'Apartament superb cu finisaje premium, vedere panoramică, parcare subterană inclusă.',
    imagineUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
    facilitati: ['Parcare', 'Piscină', 'Securitate 24/7', 'Lift', 'AC'],
  },
  {
    id: '2',
    titlu: 'Vila exclusivistă în Băneasa',
    tip: 'vila',
    tranzactie: 'vanzare',
    pret: 750000,
    suprafata: 320,
    camere: 6,
    zona: 'Băneasa',
    adresa: 'Str. Pădurea Băneasa, nr. 8',
    descriere: 'Vilă de excepție cu piscină privată, grădină peisagistică și garaj dublu.',
    imagineUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&q=80',
    facilitati: ['Piscină privată', 'Grădină', 'Garaj dublu', 'Smart home', 'Saună'],
  },
  {
    id: '3',
    titlu: 'Apartament modern în Pipera',
    tip: 'apartament',
    tranzactie: 'inchiriere',
    pret: 900,
    suprafata: 65,
    camere: 2,
    zona: 'Pipera',
    adresa: 'Bd. Pipera, nr. 12, Sector 2',
    descriere: 'Apartament complet mobilat, aproape de metrou și centrele de business.',
    imagineUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80',
    facilitati: ['Mobilat', 'Utilat', 'Parcare', 'Metrou aproape'],
  },
  {
    id: '4',
    titlu: 'Casă cu grădină în Dorobanți',
    tip: 'casa',
    tranzactie: 'vanzare',
    pret: 420000,
    suprafata: 180,
    camere: 4,
    zona: 'Dorobanți',
    adresa: 'Str. Dorobanților, nr. 55, Sector 1',
    descriere: 'Casă tradițională renovată complet, cu grădină de 200mp, în inima Dorobanților.',
    imagineUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&q=80',
    facilitati: ['Grădină', 'Garaj', 'Pivniță', 'Pod mansardabil'],
  },
  {
    id: '5',
    titlu: 'Penthouse în Aviatorilor',
    tip: 'apartament',
    tranzactie: 'inchiriere',
    pret: 3500,
    suprafata: 200,
    camere: 4,
    zona: 'Aviatorilor',
    adresa: 'Bd. Aviatorilor, nr. 70, Sector 1',
    descriere: 'Penthouse cu terasă de 80mp, vedere spectaculoasă asupra orașului, finisaje de top.',
    imagineUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80',
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
    zona: 'Tineretului',
    adresa: 'Str. Tineretului, nr. 33, Sector 4',
    descriere: 'Apartament renovare recentă, etaj 5, vedere spre parc, gresie și parchet nou.',
    imagineUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
    facilitati: ['Renovat 2024', 'Vedere parc', 'Stradă liniștită'],
  },
]
