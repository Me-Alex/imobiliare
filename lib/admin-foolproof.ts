export type AdminRow = Record<string, any>
export type AdminView = string

export type GuidedAction = {
  id: string
  title: string
  body: string
  view: AdminView
  query?: string
  mark: string
}

export type AdminTask = {
  id: string
  title: string
  meta: string
  view: AdminView
  query?: string
  tone: "danger" | "warn" | "ok" | "neutral"
  cta: string
}

export type ReadinessCheck = {
  id: string
  label: string
  ok: boolean
  detail: string
  view: AdminView
}

export type ViewGuide = {
  title: string
  goal: string
  primary: string
  steps: string[]
  avoid: string[]
}

function rows(value: unknown): AdminRow[] {
  return Array.isArray(value) ? value : []
}

function isOpenStatus(row: AdminRow) {
  return !["CLOSED", "LOST", "DONE", "SOLD", "RENTED", "PAID", "VOID", "CANCELLED"].includes(String(row.status || "").toUpperCase())
}

function ageHours(row: AdminRow) {
  const time = new Date(row.updated_at || row.created_at || 0).getTime()
  return time ? (Date.now() - time) / 3_600_000 : 0
}

export const guidedActions: GuidedAction[] = [
  { id: "property", title: "Adauga sau publica o proprietate", body: "Foloseste checklistul ca un anunt sa nu ajunga live incomplet.", view: "properties", mark: "P" },
  { id: "lead", title: "Lucreaza leadurile de azi", body: "Deschide coada CRM sortata dupa urgenta, scor si follow-up intarziat.", view: "crm", query: "NEW", mark: "CRM" },
  { id: "media", title: "Repara fotografiile si coverul", body: "Incarca media, seteaza coverul, ordoneaza galeria si adauga text alternativ.", view: "media", mark: "IMG" },
  { id: "tour", title: "Programeaza sau elibereaza vizionari", body: "Verifica sloturi, rezervari temporare, confirmari si sincronizarea Google Calendar dintr-un singur ecran.", view: "calendar", mark: "CAL" },
  { id: "invoice", title: "Creeaza sau urmareste facturi", body: "Trimite facturi Stripe, marcheaza platit, retrimite sau anuleaza in siguranta.", view: "accounting", mark: "EUR" },
  { id: "import", title: "Importa proprietati in masa", body: "Previzualizeaza CSV-ul, importa randurile valide si fa rollback daca este nevoie.", view: "bulk", mark: "CSV" },
  { id: "owner", title: "Trimite rapoarte proprietarilor", body: "Publica sau programeaza rapoarte in portalul proprietarului si verifica feedbackul.", view: "ownerPortal", mark: "OWN" },
  { id: "users", title: "Gestioneaza accesul admin", body: "Invita, reseteaza sau dezactiveaza administratori prin roluri RBAC.", view: "users", mark: "RBAC" },
]

export const viewGuides: Record<string, ViewGuide> = {
  overview: {
    title: "Incepe aici",
    goal: "Alege urmatoarea sarcina operationala fara sa cauti prin meniu.",
    primary: "Foloseste intai actiunile recomandate, apoi actiunile rapide.",
    steps: ["Verifica sarcinile rosii/galbene", "Deschide sectiunea sugerata", "Finalizeaza un flux si reincarca datele"],
    avoid: ["Nu exporta si nu sterge inainte sa verifici filtrele", "Nu ignora erorile providerilor"],
  },
  properties: {
    title: "Editor proprietati",
    goal: "Creeaza anunturi curate si sigure pentru publicare.",
    primary: "Salveaza intai draft, apoi publica doar cand checklistul este gata.",
    steps: ["Completeaza datele de baza si pretul", "Adauga locatie, specificatii si SEO", "Seteaza cover/media inainte de publicare"],
    avoid: ["Publicarea fara cover", "Lipsa email proprietar sau agent"],
  },
  media: {
    title: "Flux media",
    goal: "Fa fiecare anunt complet vizual si usor de gasit.",
    primary: "Incarca, seteaza cover, adauga text alternativ si ordoneaza galeria.",
    steps: ["Alege proprietatea", "Incarca media cu tipul corect", "Seteaza coverul si repara elementele NEEDS_ALT"],
    avoid: ["Stergerea singurei imagini cover", "Incarcarea fisierelor la proprietatea gresita"],
  },
  crm: {
    title: "Coada CRM",
    goal: "Suna intai leadurile potrivite si noteaza follow-up-ul.",
    primary: "Lucreaza prioritatile HIGH si leadurile vechi inainte sa parcurgi toate randurile.",
    steps: ["Deschide leadul principal", "Suna sau trimite email", "Actualizeaza statusul si follow-up-ul"],
    avoid: ["Leaduri NEW lasate neatins", "Clienti creati fara date de contact"],
  },
  calendar: {
    title: "Calendar",
    goal: "Pastreaza sloturile si programarile reale sincronizate.",
    primary: "Foloseste planificarea saptamanala, apoi sincronizeaza evenimentele confirmate.",
    steps: ["Verifica sloturile disponibile/rezervate/ocupate", "Elibereaza rezervarile temporare vechi", "Sincronizeaza programarile confirmate"],
    avoid: ["Dublarea unui agent", "Stergerea sloturilor rezervate fara verificarea programarii"],
  },
  appointments: {
    title: "Vizionari",
    goal: "Fa starea rezervarii explicita.",
    primary: "Foloseste actualizari de status si controale de slot, nu note manuale.",
    steps: ["Confirma cererea", "Ataseaza sau ajusteaza slotul", "Muta in DONE sau CANCELLED"],
    avoid: ["Sloturi tinute blocat permanent", "Anulare fara eliberarea slotului"],
  },
  accounting: {
    title: "Contabilitate",
    goal: "Pastreaza starea facturilor auditabila.",
    primary: "Foloseste actiunile Platit, Retrimite sau Anuleaza in loc sa editezi statusul brut.",
    steps: ["Creeaza factura", "Urmareste statusul neplatit", "Marcheaza platit sau anuleaza cu confirmare"],
    avoid: ["Anularea accidentala a facturilor active", "Retrimiterea catre email gol"],
  },
  integrations: {
    title: "Integrari",
    goal: "Fa erorile providerilor externi recuperabile.",
    primary: "Proceseaza joburile scadente, reincerca erorile de provider si anuleaza doar cand sunt depasite.",
    steps: ["Verifica statusul providerilor", "Proceseaza joburile scadente", "Reincerca sau anuleaza joburile esuate"],
    avoid: ["Reincercari repetate cu credentiale lipsa", "Anulari fara verificarea destinatarului"],
  },
  documents: {
    title: "Documente",
    goal: "Pastreaza documentele private si verificabile.",
    primary: "Incarca prin storage privat, apoi aproba sau respinge in review.",
    steps: ["Alege clientul", "Incarca fisierul privat", "Verifica statusul si expirarea"],
    avoid: ["URL-uri publice pentru fisiere sensibile", "Aprobarea documentelor expirate"],
  },
  bulk: {
    title: "Import in masa",
    goal: "Importa multe anunturi fara sa pierzi controlul.",
    primary: "Previzualizeaza intai, importa doar randurile valide si fa rollback cu confirmare.",
    steps: ["Lipeste CSV-ul", "Previzualizeaza si repara erorile", "Importa si pastreaza istoricul importului"],
    avoid: ["Sarirea previzualizarii", "Rollback pe importul gresit"],
  },
  users: {
    title: "RBAC",
    goal: "Da fiecarui admin accesul minim necesar.",
    primary: "Invita cu permisiuni explicite si dezactiveaza conturile nefolosite.",
    steps: ["Seteaza emailul", "Alege rolul si permisiunile", "Reseteaza sau dezactiveaza din tabelul de roluri"],
    avoid: ["Permisiuni totale acordate implicit", "Utilizatori inactivi lasati ACTIVE"],
  },
}

export function guideForView(view: string): ViewGuide {
  return viewGuides[view] || {
    title: "Pagina ghidata",
    goal: "Finalizeaza cate un flux si foloseste refresh dupa modificari.",
    primary: "Foloseste intai formularul principal, apoi verifica tabelul de mai jos.",
    steps: ["Verifica filtrele", "Fa o modificare", "Reincarca si confirma starea"],
    avoid: ["Modificari simultane pe inregistrari necunoscute", "Ignorarea avertismentelor"],
  }
}

export function buildAdminTasks(core: AdminRow, modules: AdminRow, platform: AdminRow, metrics: AdminRow): AdminTask[] {
  const properties = rows(core.properties)
  const leads = rows(core.leads)
  const appointments = rows(core.appointments)
  const documents = [...rows(modules.documents), ...rows(platform.client_documents)]
  const providerJobs = rows(platform.admin_provider_jobs)
  const invoices = rows(platform.admin_invoices)
  const media = rows(platform.property_media)
  const runtimeHealth = platform.runtime_health || {}

  const failedJobs = providerJobs.filter((row) => String(row.status || "").includes("FAILED"))
  const staleLeads = rows(metrics.activeLeads).filter((row) => ageHours(row) >= 24)
  const newLeads = leads.filter((row) => String(row.status || "NEW").toUpperCase() === "NEW")
  const draftProperties = properties.filter((row) => String(row.status || "").toUpperCase() === "DRAFT")
  const missingCover = properties.filter((row) => !row.cover_image_url && !row.cover_image && !["SOLD", "RENTED"].includes(String(row.status || "").toUpperCase()))
  const needsAlt = media.filter((row) => String(row.review_status || "").toUpperCase() === "NEEDS_ALT" || !row.alt)
  const pendingDocs = documents.filter((row) => !["APPROVED", "SIGNED", "VALID"].includes(String(row.status || "").toUpperCase()))
  const openInvoices = invoices.filter(isOpenStatus)
  const missingRequired = Number(runtimeHealth.summary?.missingRequired || 0)
  const missingOptional = Number(runtimeHealth.summary?.missingOptional || 0)
  const nextTours = appointments.filter((row) => {
    const start = new Date(row.start_at || row.requested_at || 0).getTime()
    return start && start >= Date.now() && start <= Date.now() + 7 * 24 * 60 * 60 * 1000
  })

  const tasks: AdminTask[] = [
    missingRequired ? { id: "missing-required-env", title: `${missingRequired} secret(e) obligatorii lipsa`, meta: "Functiile admin/service ruleaza degradat pana cand se configureaza secretele Cloudflare.", view: "integrations", query: "missing", tone: "danger", cta: "Verifica readiness" } : null,
    !missingRequired && missingOptional ? { id: "missing-provider-env", title: `${missingOptional} variabile provider lipsa`, meta: "Actiunile provider esueaza controlat, dar automatizarile email/SMS/semnare/facturare sunt incomplete.", view: "integrations", query: "missing", tone: "warn", cta: "Verifica providerii" } : null,
    failedJobs.length ? { id: "failed-jobs", title: `${failedJobs.length} job(uri) provider esuate`, meta: "Reincerca sau anuleaza inainte ca clientii sa rateze emailuri, SMS-uri sau evenimente calendar.", view: "integrations", query: "FAILED", tone: "danger", cta: "Repara integrarile" } : null,
    staleLeads.length ? { id: "stale-leads", title: `${staleLeads.length} lead(uri) vechi necesita follow-up`, meta: "Mai vechi de 24h si inca active.", view: "crm", query: "NEW", tone: "warn", cta: "Deschide CRM" } : null,
    newLeads.length ? { id: "new-leads", title: `${newLeads.length} lead(uri) noi in asteptare`, meta: "Incepe cu leadurile apelabile si cu scor mare.", view: "crm", query: "NEW", tone: "warn", cta: "Suna leadurile" } : null,
    draftProperties.length ? { id: "drafts", title: `${draftProperties.length} anunt(uri) draft`, meta: "Completeaza checklistul inainte de publicare.", view: "properties", query: "DRAFT", tone: "neutral", cta: "Finalizeaza anunturi" } : null,
    missingCover.length ? { id: "missing-cover", title: `${missingCover.length} anunt(uri) fara cover`, meta: "Imaginea cover este cel mai frecvent blocaj la publicare.", view: "media", query: "cover", tone: "warn", cta: "Repara media" } : null,
    needsAlt.length ? { id: "needs-alt", title: `${needsAlt.length} element(e) media fara text alternativ`, meta: "Imbunatateste SEO, accesibilitatea si calitatea publicarii.", view: "media", query: "NEEDS_ALT", tone: "neutral", cta: "Verifica media" } : null,
    pendingDocs.length ? { id: "pending-docs", title: `${pendingDocs.length} document(e) necesita review`, meta: "Aproba, respinge sau incarca fisierele private lipsa.", view: "documents", query: "PENDING", tone: "warn", cta: "Verifica documente" } : null,
    openInvoices.length ? { id: "open-invoices", title: `${openInvoices.length} factura/facturi deschise`, meta: "Retrimite, marcheaza platit sau anuleaza in siguranta.", view: "accounting", query: "SENT", tone: "neutral", cta: "Deschide contabilitatea" } : null,
    nextTours.length ? { id: "next-tours", title: `${nextTours.length} vizionare in urmatoarele 7 zile`, meta: "Verifica sloturile si sincronizeaza calendarul inainte de vizite.", view: "calendar", tone: "ok", cta: "Deschide calendar" } : null,
  ].filter(Boolean) as AdminTask[]

  return tasks.length ? tasks : [{ id: "clean", title: "Nu exista blocaje urgente in admin", meta: "Foloseste actiunile rapide pentru lucru nou sau export de raport.", view: "overview", tone: "ok", cta: "Ramai pe dashboard" }]
}

export function buildReadinessChecks(core: AdminRow, platform: AdminRow): ReadinessCheck[] {
  const properties = rows(core.properties)
  const roles = rows(platform.admin_roles)
  const providerJobs = rows(platform.admin_provider_jobs)
  const media = rows(platform.property_media)
  const documents = rows(platform.client_documents)
  const runtimeHealth = platform.runtime_health || {}
  const healthSummary = runtimeHealth.summary || {}

  return [
    { id: "runtime", label: "Secrete runtime pregatite", ok: Number(healthSummary.missingRequired || 0) === 0, detail: `${healthSummary.configuredRequired || 0}/${healthSummary.required || 0} obligatorii`, view: "integrations" },
    { id: "providers", label: "Provideri configurati", ok: Number(healthSummary.readyProviders || 0) >= Number(healthSummary.totalProviders || 1), detail: `${healthSummary.readyProviders || 0}/${healthSummary.totalProviders || 0} provideri`, view: "integrations" },
    { id: "rbac", label: "RBAC configurat", ok: roles.some((row) => String(row.status || "").toUpperCase() === "ACTIVE"), detail: `${roles.length} rol(uri)`, view: "users" },
    { id: "media", label: "Media pregatita", ok: properties.every((row) => row.cover_image_url || row.cover_image || ["SOLD", "RENTED"].includes(String(row.status || "").toUpperCase())), detail: `${media.length} element(e) media`, view: "media" },
    { id: "provider-jobs", label: "Coada providerilor curata", ok: !providerJobs.some((row) => String(row.status || "").includes("FAILED")), detail: `${providerJobs.length} job(uri)`, view: "integrations" },
    { id: "documents", label: "Documente urmarite", ok: documents.length > 0, detail: `${documents.length} document(e) client`, view: "documents" },
    { id: "inventory", label: "Inventar activ", ok: properties.length > 0, detail: `${properties.length} anunt(uri)`, view: "properties" },
  ]
}
