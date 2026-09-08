import type { WorkspaceProperty } from './transaction-workspace'

export function analyzeOwnerProperty(property: WorkspaceProperty, allComparables: WorkspaceProperty[]) {
  const area = Number(property.area_sqm)
  const price = Number(property.price)
  const validSubject = Number.isFinite(area) && area > 0 && Number.isFinite(price) && price > 0
  const propertyPricePerSqm = validSubject ? price / area : null
  const candidates = allComparables.filter(item => item.id !== property.id
    && Boolean(property.type && property.zone && property.city && property.transaction_type && property.currency)
    && item.type === property.type && item.zone === property.zone && item.city === property.city
    && item.transaction_type === property.transaction_type && item.currency === property.currency
    && Number(item.area_sqm) > 0 && Number(item.price) > 0)
  const values = candidates.map(item => Number(item.price) / Number(item.area_sqm)).filter(Number.isFinite)
  const hasComparison = validSubject && values.length >= 3
  const marketAverage = hasComparison ? values.reduce((sum, value) => sum + value, 0) / values.length : null
  const difference = marketAverage && propertyPricePerSqm ? (propertyPricePerSqm - marketAverage) / marketAverage * 100 : 0
  const adjustmentPercent = difference > 8 ? Math.min(15, Math.max(3, Math.round(difference - 3))) : 0
  const recommendedPrice = adjustmentPercent ? Math.round(price * (1 - adjustmentPercent / 100)) : price
  return { marketAverage, propertyPricePerSqm, comparableCount: values.length, hasComparison, adjustmentPercent, recommendedPrice }
}

export function ownerFeedbackText(item: Record<string, unknown>) {
  if (typeof item.feedback === 'string' && item.feedback.trim()) return item.feedback.trim()
  if (item.would_proceed === true) return 'Interes confirmat după vizionare.'
  if (item.would_proceed === false) return 'Nu dorește să continue în acest moment.'
  return 'Evaluare trimisă fără comentariu sau decizie.'
}

const eventLabels: Record<string, string> = {
  NEW: 'Nou', QUALIFIED: 'Calificat', VIEWING: 'Vizionare', OFFER: 'Ofertă', CONTRACT: 'Contract',
  CLOSED_WON: 'Finalizată', CLOSED_LOST: 'Închisă fără tranzacție', ACTIVE: 'Activă', ON_HOLD: 'În așteptare', CLOSED: 'Închisă',
  PENDING: 'În așteptare', SUBMITTED: 'Trimisă', ACCEPTED: 'Acceptată', REJECTED: 'Respinsă', WITHDRAWN: 'Retrasă', EXPIRED: 'Expirată', COUNTERED: 'Contraofertă',
}

export function ownerEventSummary(value: unknown): string {
  const summary = typeof value === 'string' ? value : ''
  const stage = /^Etapa a fost schimbată din ([A-Z_]+) în ([A-Z_]+)$/.exec(summary)
  if (stage && eventLabels[stage[1]] && eventLabels[stage[2]]) return `Etapă: ${eventLabels[stage[1]]} → ${eventLabels[stage[2]]}`
  const status = /^Starea (ofertei|tranzacției) a fost (?:actualizată|schimbată) în ([A-Z_]+)$/.exec(summary)
  if (status && eventLabels[status[2]]) return `${status[1] === 'ofertei' ? 'Ofertă' : 'Tranzacție'}: ${eventLabels[status[2]]}`
  return summary
}
