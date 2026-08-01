import type { AccountRole } from '@/lib/account-roles'
import {
  getPublishedPropertyQuality,
  type PublishedPropertyQuality,
} from '@/lib/property-publication-readiness'
import type { UserProperty } from '@/lib/types'

export type PropertyPortfolioGuideTarget =
  | 'publish'
  | 'optimize'
  | 'services'
  | 'performance'
  | 'documents'
  | 'admin'

export type PropertyPortfolioGuideTone = 'primary' | 'warning' | 'success' | 'neutral'

export interface PropertyPortfolioGuideAction {
  target: PropertyPortfolioGuideTarget
  label: string
  propertyId?: string
}

export interface PropertyPortfolioGuideCard {
  id: 'publication' | 'quality' | 'media' | 'operations'
  title: string
  description: string
  badgeLabel: string
  tone: PropertyPortfolioGuideTone
  action: PropertyPortfolioGuideAction
}

export interface PropertyPortfolioGuide {
  headline: string
  description: string
  primaryAction: PropertyPortfolioGuideAction
  cards: readonly PropertyPortfolioGuideCard[]
  metrics: {
    total: number
    active: number
    published: number
    drafts: number
    averageQuality: number
    needsOptimization: number
    missingTour: number
    missingCover: number
  }
}

interface QualityRow {
  property: UserProperty
  quality: PublishedPropertyQuality
  status: string
}

interface PropertyPortfolioGuideInput {
  role: Extract<AccountRole, 'OWNER' | 'ADMIN'>
  properties: readonly UserProperty[]
}

function statusOf(property: UserProperty) {
  return String(property.status || 'DRAFT').toUpperCase()
}

function isArchived(property: UserProperty) {
  return ['ARCHIVED', 'SOLD', 'RENTED'].includes(statusOf(property))
}

function hasCover(property: UserProperty) {
  return Boolean(String(property.cover_url || property.coverUrl || '').trim())
}

function titleOf(property: UserProperty) {
  return String(property.title || 'proprietatea selectată')
}

function plural(value: number, singular: string, pluralValue: string) {
  return `${value} ${value === 1 ? singular : pluralValue}`
}

function qualityRows(properties: readonly UserProperty[]): QualityRow[] {
  return properties.map((property) => ({
    property,
    quality: getPublishedPropertyQuality(property),
    status: statusOf(property),
  }))
}

function firstPropertyId(rows: readonly QualityRow[]) {
  return rows[0]?.property.id ? String(rows[0].property.id) : undefined
}

function firstTitle(rows: readonly QualityRow[]) {
  return rows[0] ? titleOf(rows[0].property) : 'anunț'
}

export function getPropertyPortfolioGuide({
  role,
  properties,
}: PropertyPortfolioGuideInput): PropertyPortfolioGuide {
  const rows = qualityRows(properties)
  const activeRows = rows.filter(({ property }) => !isArchived(property))
  const publishedRows = activeRows.filter(({ status }) => status === 'PUBLISHED')
  const draftRows = activeRows.filter(({ status }) => status === 'DRAFT')
  const needsOptimizationRows = activeRows
    .filter(({ quality }) => quality.score < 80)
    .sort((a, b) => a.quality.score - b.quality.score)
  const missingTourRows = activeRows.filter(({ quality }) =>
    quality.recommendations.some((recommendation) => recommendation.id === 'virtual-tour'),
  )
  const missingCoverRows = activeRows.filter(({ property }) => !hasCover(property))
  const averageQuality = activeRows.length
    ? Math.round(activeRows.reduce((total, row) => total + row.quality.score, 0) / activeRows.length)
    : 0

  const metrics = {
    total: rows.length,
    active: activeRows.length,
    published: publishedRows.length,
    drafts: draftRows.length,
    averageQuality,
    needsOptimization: needsOptimizationRows.length,
    missingTour: missingTourRows.length,
    missingCover: missingCoverRows.length,
  }

  if (activeRows.length === 0) {
    return {
      headline: role === 'ADMIN' ? 'Portofoliul nu are proprietăți active' : 'Începe cu prima proprietate',
      description: role === 'ADMIN'
        ? 'Când apar anunțuri active, le vei putea audita după status, calitate, media și pașii operaționali.'
        : 'Publică prima proprietate, apoi pagina va urmări calitatea, promovarea, documentele și performanța.',
      primaryAction: { target: 'publish', label: 'Adaugă proprietate' },
      metrics,
      cards: [
        {
          id: 'publication',
          title: 'Publicare',
          description: 'Creează anunțul complet o singură dată: date, pin pe hartă, fotografii și tur.',
          badgeLabel: 'Start',
          tone: 'primary',
          action: { target: 'publish', label: 'Începe publicarea' },
        },
        {
          id: 'quality',
          title: 'Calitate',
          description: 'După publicare vei vedea scorul și recomandarea principală pentru fiecare proprietate.',
          badgeLabel: 'Automat',
          tone: 'neutral',
          action: { target: 'publish', label: 'Pregătește anunț' },
        },
        {
          id: 'operations',
          title: 'Următorul fir',
          description: 'Vizionările, documentele și performanța se leagă automat de proprietatea publicată.',
          badgeLabel: 'Conectat',
          tone: 'neutral',
          action: { target: role === 'ADMIN' ? 'admin' : 'performance', label: role === 'ADMIN' ? 'Vezi admin' : 'Vezi performanța' },
        },
      ],
    }
  }

  let primaryAction: PropertyPortfolioGuideAction
  let headline: string
  let description: string

  if (draftRows.length > 0) {
    primaryAction = {
      target: 'optimize',
      label: role === 'ADMIN' ? 'Verifică primul draft' : 'Continuă draftul',
      propertyId: firstPropertyId(draftRows),
    }
    headline = role === 'ADMIN' ? 'Ai drafturi de verificat' : 'Ai anunțuri începute'
    description = `${plural(draftRows.length, 'proprietate este în draft', 'proprietăți sunt în draft')}. Verifică datele și calitatea înainte să te bazezi pe vizionări sau promovare.`
  } else if (needsOptimizationRows.length > 0) {
    primaryAction = {
      target: 'optimize',
      label: 'Optimizează primul anunț',
      propertyId: firstPropertyId(needsOptimizationRows),
    }
    headline = 'Calitatea anunțurilor cere atenție'
    description = `${firstTitle(needsOptimizationRows)} are cea mai mare nevoie de optimizare. Rezolvă întâi recomandarea principală, apoi verifică performanța.`
  } else if (missingTourRows.length > 0) {
    primaryAction = {
      target: 'services',
      label: 'Planifică foto / tur virtual',
      propertyId: firstPropertyId(missingTourRows),
    }
    headline = 'Portofoliul este bun, dar poate deveni premium'
    description = `${plural(missingTourRows.length, 'proprietate nu are tur virtual', 'proprietăți nu au tur virtual')}. Serviciile foto/video pot crește calitatea lead-urilor.`
  } else {
    primaryAction = {
      target: role === 'ADMIN' ? 'admin' : 'performance',
      label: role === 'ADMIN' ? 'Vezi operațiunile' : 'Vezi performanța',
    }
    headline = 'Portofoliul este pregătit pentru urmărire'
    description = 'Anunțurile active au o bază bună. Următorul pas este să urmărești vizualizări, cereri, feedback și documente.'
  }

  const qualityAction = needsOptimizationRows.length > 0
    ? {
        target: 'optimize' as const,
        label: 'Optimizează',
        propertyId: firstPropertyId(needsOptimizationRows),
      }
    : {
        target: 'performance' as const,
        label: 'Vezi performanța',
      }

  return {
    headline,
    description,
    primaryAction,
    metrics,
    cards: [
      {
        id: 'publication',
        title: draftRows.length > 0 ? 'Drafturi de închis' : 'Publicare stabilă',
        description: draftRows.length > 0
          ? `${plural(draftRows.length, 'draft trebuie finalizat', 'drafturi trebuie finalizate')} înainte de promovare.`
          : `${plural(publishedRows.length, 'anunț publicat', 'anunțuri publicate')} pot trimite lead-uri spre vizionări și Deal Room.`,
        badgeLabel: draftRows.length > 0 ? plural(draftRows.length, 'draft', 'drafturi') : plural(publishedRows.length, 'publicat', 'publicate'),
        tone: draftRows.length > 0 ? 'warning' : 'success',
        action: draftRows.length > 0
          ? { target: 'optimize', label: 'Continuă draft', propertyId: firstPropertyId(draftRows) }
          : { target: 'publish', label: 'Adaugă altă proprietate' },
      },
      {
        id: 'quality',
        title: averageQuality >= 80 ? 'Calitate bună' : 'Calitate de îmbunătățit',
        description: needsOptimizationRows.length > 0
          ? `${firstTitle(needsOptimizationRows)} are scorul cel mai mic. Începe cu recomandarea principală.`
          : `Scor mediu ${averageQuality}%. Menține standardul înainte de promovări plătite sau recompense.`,
        badgeLabel: `${averageQuality}% medie`,
        tone: needsOptimizationRows.length > 0 ? 'warning' : 'success',
        action: qualityAction,
      },
      {
        id: 'media',
        title: missingCoverRows.length > 0 || missingTourRows.length > 0 ? 'Media incompletă' : 'Media pregătită',
        description: missingCoverRows.length > 0
          ? `${plural(missingCoverRows.length, 'anunț nu are copertă', 'anunțuri nu au copertă')}. Fotografia de copertă este primul semnal de încredere.`
          : missingTourRows.length > 0
            ? `${plural(missingTourRows.length, 'anunț fără tur virtual', 'anunțuri fără tur virtual')}. Turul virtual filtrează mai bine vizionările.`
            : 'Fotografiile și tururile sunt pregătite pentru comparații și promovare.',
        badgeLabel: missingTourRows.length > 0 ? `${missingTourRows.length} fără tur` : `${missingCoverRows.length} fără copertă`,
        tone: missingCoverRows.length > 0 || missingTourRows.length > 0 ? 'warning' : 'success',
        action: missingCoverRows.length > 0
          ? { target: 'optimize', label: 'Adaugă copertă', propertyId: firstPropertyId(missingCoverRows) }
          : { target: 'services', label: missingTourRows.length > 0 ? 'Vezi servicii tur' : 'Vezi servicii foto' },
      },
      {
        id: 'operations',
        title: role === 'ADMIN' ? 'Audit operațional' : 'Traseu după publicare',
        description: role === 'ADMIN'
          ? 'Urmărește agentul responsabil, calitatea, documentele și blocajele din panoul administrativ.'
          : 'După ce anunțul atrage interes, continuă în performanță, vizionări, Deal Room și documente.',
        badgeLabel: role === 'ADMIN' ? 'Admin' : 'Conectat',
        tone: 'neutral',
        action: { target: role === 'ADMIN' ? 'admin' : 'documents', label: role === 'ADMIN' ? 'Deschide admin' : 'Vezi documente' },
      },
    ],
  }
}
