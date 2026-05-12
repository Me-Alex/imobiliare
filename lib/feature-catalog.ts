export type FeatureCategory = "client" | "search" | "property" | "lead" | "admin" | "finance" | "content" | "automation" | "trust" | "growth"
export type FeatureStatus = "live" | "next" | "planned"
export type FeatureImpact = "ridicat" | "mediu" | "rapid"

export type FeatureItem = { id: number; category: FeatureCategory; title: string; benefit: string; status: FeatureStatus; impact: FeatureImpact }

export const featureCategories: Record<FeatureCategory, string> = {
  client: "Experienta client", search: "Cautare si filtre", property: "Proprietati", lead: "CRM si lead-uri", admin: "Admin operational",
  finance: "Financiar", content: "Continut si SEO", automation: "Automatizari", trust: "Incredere", growth: "Crestere",
}

const rawFeatures = `
client|Favorite persistente|Clientul salveaza proprietati in browser.|live|ridicat
client|Comparatie rapida|Compara pana la trei proprietati.|live|ridicat
client|Programare vizionare|Formular dedicat cu data preferata.|live|ridicat
client|Confirmare cerere|Mesaj clar dupa trimitere.|live|rapid
client|Checklist cumparator|Clientul vede pasii importanti.|next|mediu
client|Scor potrivire|Recomandare pe baza bugetului si zonei.|next|ridicat
client|Plan de vizionare|Ordine clara pentru vizite multiple.|planned|mediu
client|Intrebari pentru agent|Lista utila inainte de apel.|planned|rapid
client|Status cerere client|Clientul stie daca a fost contactat.|planned|ridicat
client|Profil cautare|Preferinte salvate pentru sesiuni viitoare.|planned|ridicat
search|Cautare text|Cauta dupa zona, adresa sau descriere.|live|ridicat
search|Filtru tip proprietate|Apartamente, case, vile, terenuri.|live|rapid
search|Filtru zona|Restrange portofoliul dupa oras sau zona.|live|rapid
search|Filtru camere|Afiseaza doar proprietati potrivite.|live|rapid
search|Buget maxim|Controleaza rapid limita de pret.|live|ridicat
search|Suprafata minima|Elimina ofertele prea mici.|live|mediu
search|Sortare pret|Ordoneaza crescator sau descrescator.|live|rapid
search|Sortare suprafata|Prioritizeaza proprietatile mari.|live|rapid
search|Filtru oferte selectate|Scoate in fata listarile recomandate.|live|mediu
search|Resetare cautare|Revine instant la lista completa.|live|rapid
property|Pagina detaliu dedicata|Fiecare proprietate are URL propriu.|live|ridicat
property|Pret pe metru patrat|Clientul intelege valoarea reala.|live|ridicat
property|Rata orientativa|Estimare rapida pentru credit.|live|ridicat
property|Proprietati similare|Alternative relevante in acelasi oras.|live|ridicat
property|Etape de verificare|Explica actele, comparatia si pasul urmator.|live|mediu
property|Galerii tip proprietate|Imagini potrivite pe apartament, vila sau teren.|live|mediu
property|Badge selectata|Marcheaza ofertele importante.|live|rapid
property|Publicare draft|Adminul controleaza vizibilitatea.|live|ridicat
property|Stergere controlata|Adminul poate curata portofoliul.|live|mediu
property|Editor proprietate noua|Adauga listari direct din admin.|live|ridicat
lead|Lead-uri din contact|Cererile ajung in baza de date.|live|ridicat
lead|Status lead|NEW, CONTACTED, QUALIFIED, CLOSED, LOST.|live|ridicat
lead|Update status lead|Schimbare salvata din admin.|live|ridicat
lead|Cautare clienti|Gaseste rapid un lead.|live|mediu
lead|Click telefon|Telefon apelabil direct din tabel.|live|rapid
lead|Sursa lead|Diferentiaza contact, proprietate, campanie.|next|mediu
lead|Scor lead|Prioritizeaza clientii calzi.|planned|ridicat
lead|Note interne|Agentii pastreaza contextul discutiei.|planned|ridicat
lead|Reminder follow-up|Nu se pierd oportunitati.|planned|ridicat
lead|Pipeline vizual|Lead-uri pe etape comerciale.|planned|ridicat
admin|Dashboard live|Vede rapid portofoliu, clienti si vizionari.|live|ridicat
admin|Navigatie laterala|Acces rapid la module.|live|mediu
admin|Cautare globala admin|Filtreaza randuri in fiecare modul.|live|ridicat
admin|Raport CSV|Export rapid pentru portofoliu si lead-uri.|live|ridicat
admin|Planuri de plata|Gestioneaza planuri salvate in Supabase.|live|ridicat
admin|Proiecte|Urmareste progres si deadline.|live|ridicat
admin|Utilizatori echipa|Administreaza roluri operationale.|live|mediu
admin|Setari agentie|Comision, tinta si TVA configurabile.|live|mediu
admin|Audit actiuni|Istoric pentru evenimente importante.|live|ridicat
admin|Refresh manual|Datele pot fi reincarcate instant.|live|rapid
finance|Calculator credit|Estimare rata lunara.|live|ridicat
finance|Evaluator suprafata|Calculeaza valoare dupa pret/mp.|live|ridicat
finance|Estimator comision|Total comision pe portofoliu publicat.|live|ridicat
finance|Avans configurabil|Clientul vede scenarii diferite.|live|mediu
finance|Durata credit|Anii influenteaza rata estimata.|live|mediu
finance|Valoare ramasa plan|Planul arata total minus avans.|live|mediu
finance|Tinta vanzari|Adminul vede tinta configurata.|live|mediu
finance|TVA setabil|Pregatit pentru calcule comerciale.|live|rapid
finance|Scenarii ROI|Compara randament chirie vs achizitie.|next|ridicat
finance|Costuri notariale|Estimare pentru buget complet.|planned|ridicat
content|Texte reformulate|Ton mai natural si mai putin generic.|live|mediu
content|Meta proprietati|Titluri si descrieri pentru SEO.|live|mediu
content|Sitemap|Motoarele de cautare descopera paginile.|live|mediu
content|Robots|Reguli clare pentru indexare.|live|rapid
content|FAQ|Raspunde obiectiilor frecvente.|live|mediu
content|Proces explicat|Clientul intelege colaborarea.|live|mediu
content|Beneficii agentie|Clarifica diferentiatorii HQS.|live|rapid
content|Highlight-uri proprietati|Scurteaza timpul de evaluare.|live|mediu
content|Ghid cumparator|Pagina educationala pentru achizitie.|planned|mediu
content|Ghid vanzator|Ajuta proprietarii sa listeze corect.|planned|mediu
automation|RPC securizat admin|Actiunile admin trec prin secret.|live|ridicat
automation|Inserare vizionari prin RPC|Formularul public nu scrie direct in tabel.|live|ridicat
automation|Audit automat vizionari|Crearea cererii este logata.|live|ridicat
automation|Audit status vizionare|Schimbarile sunt inregistrate.|live|ridicat
automation|Persistenta module admin|Planurile si proiectele raman salvate.|live|ridicat
automation|LocalStorage selectie|Favoritele si comparatia raman dupa refresh.|live|mediu
automation|Evenimente selectie|Cardurile si lista raman sincronizate.|live|mediu
automation|Deploy Cloudflare Pages|Site-ul ruleaza pe domeniul live.|live|ridicat
automation|Reminder intern|Follow-up automat pentru lead-uri.|planned|ridicat
automation|Notificare email|Adminul primeste cereri noi.|planned|ridicat
trust|Autentificare admin|Adminul este protejat cu user si parola.|live|ridicat
trust|RLS activ pe tabele noi|Reduce expunerea datelor.|live|ridicat
trust|Validare contact|Nume si telefon obligatorii.|live|mediu
trust|Statusuri controlate|Baza accepta doar statusuri valide.|live|mediu
trust|Confirmari stergere|Reduce erorile operationale.|live|rapid
trust|Mesaje eroare clare|Adminul intelege problema.|live|mediu
trust|Link-uri proprietati sigure|Slugurile duc la pagini dedicate.|live|rapid
trust|Date audit limitate|Adminul vede ultimele evenimente importante.|live|mediu
trust|Politica cookies|Claritate pentru tracking si preferinte.|planned|mediu
trust|Pagina confidentialitate|Pregatire pentru conformitate.|planned|mediu
growth|Pagina 100 functionalitati|Arata progresul produsului.|next|mediu
growth|Roadmap filtrabil|Echipa vede ce urmeaza.|next|mediu
growth|Export roadmap|Lista poate fi trimisa sau arhivata.|next|rapid
growth|Functionalitati salvate|Adminul marcheaza prioritatile.|next|mediu
growth|Scor maturitate|Masura clara pentru progres.|next|mediu
growth|Plan implementare|Genereaza urmatorii pasi din selectie.|next|ridicat
growth|Grupare pe impact|Prioritizeaza rapid dupa valoare.|next|rapid
growth|Filtru status|Separi live, next si planned.|next|rapid
growth|Cautare roadmap|Gasesti functionalitatea dupa nume.|next|rapid
growth|Indicator progres 100|Arata cate functionalitati sunt live.|next|mediu
`

export const featureCatalog: FeatureItem[] = rawFeatures.trim().split("\n").map((line, index) => {
  const [category, title, benefit, status, impact] = line.split("|")
  return { id: index + 1, category: category as FeatureCategory, title, benefit, status: status as FeatureStatus, impact: impact as FeatureImpact }
})
