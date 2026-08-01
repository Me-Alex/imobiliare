export type AdminOperationsStageId = 'compliance' | 'portfolio' | 'transactions' | 'closing'
export type AdminOperationsStageState = 'blocked' | 'urgent' | 'active' | 'healthy'
export type AdminOperationsDestination = 'compliance' | 'property_quality' | 'property_unassigned' | 'properties' | 'crm' | 'transactions' | 'documents'

export interface AdminOperationsStage {
  id: AdminOperationsStageId
  title: string
  description: string
  state: AdminOperationsStageState
  count: number
  actionLabel: string
  destination: AdminOperationsDestination
  signals: string[]
}

export interface AdminOperationsFlow {
  headline: string
  description: string
  healthPercent: number
  activeCount: number
  stages: AdminOperationsStage[]
  primaryStage: AdminOperationsStage
}

export interface AdminOperationsFlowInput {
  legalProfileReady: boolean
  templatesPendingReview: number
  draftProperties: number
  propertiesNeedOptimization: number
  unassignedProperties: number
  openLeads: number
  overdueLeads: number
  pendingAppointments: number
  activeDeals: number
  pendingDocuments: number
  pendingRedemptions: number
}

function plural(count: number, one: string, many: string) {
  return count === 1 ? `1 ${one}` : `${count} ${many}`
}

function stageState(count: number, urgent: boolean, blocked = false): AdminOperationsStageState {
  if (blocked) return 'blocked'
  if (urgent) return 'urgent'
  if (count > 0) return 'active'
  return 'healthy'
}

export function getAdminOperationsFlow(input: AdminOperationsFlowInput): AdminOperationsFlow {
  const complianceBlockers = (input.legalProfileReady ? 0 : 1) + input.templatesPendingReview
  const portfolioCount = input.draftProperties + input.propertiesNeedOptimization + input.unassignedProperties
  const transactionCount = input.overdueLeads + input.pendingAppointments + input.activeDeals
  const closingCount = input.pendingDocuments + input.pendingRedemptions

  const stages: AdminOperationsStage[] = [
    {
      id: 'compliance',
      title: 'Conformitate',
      description: complianceBlockers > 0
        ? 'Deblochează profilul juridic, GDPR-ul și șabloanele înainte ca documentele finale să fie folosite.'
        : 'Profilul juridic și șabloanele nu blochează fluxul operațional.',
      state: stageState(complianceBlockers, false, complianceBlockers > 0),
      count: complianceBlockers,
      actionLabel: complianceBlockers > 0 ? 'Rezolvă conformitatea' : 'Vezi conformitatea',
      destination: 'compliance',
      signals: [
        input.legalProfileReady ? 'Profil juridic pregătit' : 'Profil juridic/GDPR incomplet',
        input.templatesPendingReview > 0
          ? plural(input.templatesPendingReview, 'șablon fără aviz', 'șabloane fără aviz')
          : 'Șabloane fără blocaj critic',
      ],
    },
    {
      id: 'portfolio',
      title: 'Portofoliu',
      description: portfolioCount > 0
        ? 'Curăță anunțurile înainte de promovare: status, agent responsabil, calitate, pin, fotografii și tur.'
        : 'Portofoliul activ nu are blocaje vizibile de publicare sau calitate.',
      state: stageState(portfolioCount, input.unassignedProperties > 0 || input.draftProperties > 0),
      count: portfolioCount,
      actionLabel: input.unassignedProperties > 0
        ? 'Repartizează agent'
        : input.draftProperties > 0
          ? 'Verifică ciorne'
          : 'Optimizează anunțuri',
      destination: input.unassignedProperties > 0
        ? 'property_unassigned'
        : input.draftProperties > 0
          ? 'properties'
          : 'property_quality',
      signals: [
        input.draftProperties > 0
          ? plural(input.draftProperties, 'ciornă de publicat', 'ciorne de publicat')
          : 'Fără ciorne restante',
        input.unassignedProperties > 0
          ? plural(input.unassignedProperties, 'proprietate fără agent', 'proprietăți fără agent')
          : 'Responsabili alocați',
        input.propertiesNeedOptimization > 0
          ? plural(input.propertiesNeedOptimization, 'anunț de optimizat', 'anunțuri de optimizat')
          : 'Calitate portofoliu stabilă',
      ],
    },
    {
      id: 'transactions',
      title: 'Clienți și vizionări',
      description: transactionCount > 0
        ? 'Ține ritmul comercial: răspuns la lead-uri, confirmări de vizionare și următorul pas al tranzacției.'
        : 'Nu există lead-uri întârziate sau vizionări care cer intervenție imediată.',
      state: stageState(transactionCount, input.overdueLeads > 0 || input.pendingAppointments > 0),
      count: transactionCount,
      actionLabel: input.overdueLeads > 0 ? 'Deschide CRM' : 'Vezi tranzacțiile',
      destination: input.overdueLeads > 0 ? 'crm' : 'transactions',
      signals: [
        input.overdueLeads > 0
          ? plural(input.overdueLeads, 'lead întârziat', 'lead-uri întârziate')
          : `${input.openLeads} lead-uri deschise`,
        input.pendingAppointments > 0
          ? plural(input.pendingAppointments, 'vizionare de confirmat', 'vizionări de confirmat')
          : 'Vizionări fără blocaj de confirmare',
        input.activeDeals > 0
          ? plural(input.activeDeals, 'tranzacție activă', 'tranzacții active')
          : 'Fără tranzacții active',
      ],
    },
    {
      id: 'closing',
      title: 'Documente și recompense',
      description: closingCount > 0
        ? 'Închide munca administrativă rămasă: documente solicitate, dosare incomplete și cereri HQS Coins.'
        : 'Documentele și recompensele nu au cereri administrative restante.',
      state: stageState(closingCount, input.pendingDocuments > 0),
      count: closingCount,
      actionLabel: input.pendingDocuments > 0 ? 'Verifică documente' : 'Soluționează coins',
      destination: input.pendingDocuments > 0 ? 'documents' : 'transactions',
      signals: [
        input.pendingDocuments > 0
          ? plural(input.pendingDocuments, 'document restant', 'documente restante')
          : 'Fără documente restante',
        input.pendingRedemptions > 0
          ? plural(input.pendingRedemptions, 'cerere HQS Coins', 'cereri HQS Coins')
          : 'Fără cereri coins în așteptare',
      ],
    },
  ]

  const activeCount = stages.reduce((total, stage) => total + stage.count, 0)
  const healthyStages = stages.filter((stage) => stage.state === 'healthy').length
  const primaryStage = stages.find((stage) => stage.state === 'blocked')
    ?? stages.find((stage) => stage.state === 'urgent')
    ?? stages.find((stage) => stage.state === 'active')
    ?? stages[0]
  const healthPercent = Math.round((healthyStages / stages.length) * 100)

  return {
    headline: activeCount > 0
      ? `Prioritatea operațională: ${primaryStage.title.toLowerCase()}`
      : 'Operațiunile sunt la zi',
    description: activeCount > 0
      ? primaryStage.description
      : 'Nu există blocaje vizibile în conformitate, portofoliu, tranzacții sau documente.',
    healthPercent,
    activeCount,
    primaryStage,
    stages,
  }
}
