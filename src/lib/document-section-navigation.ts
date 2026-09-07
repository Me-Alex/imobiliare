export const DOCUMENT_SECTIONS = ['overview', 'files', 'requests', 'upload', 'generate'] as const
export type DocumentSection = typeof DOCUMENT_SECTIONS[number]

export function readDocumentSection(url: URL): DocumentSection {
  const value = url.searchParams.get('section')
  return DOCUMENT_SECTIONS.includes(value as DocumentSection) ? value as DocumentSection : 'overview'
}

export function documentSectionUrl(url: URL, appointmentId: string | null, section: DocumentSection = 'overview'): URL {
  const next = new URL(url)
  next.searchParams.set('page', 'documente')
  next.searchParams.delete('focus')
  if (appointmentId) next.searchParams.set('appointment', appointmentId)
  else {
    next.searchParams.delete('appointment')
    next.searchParams.delete('deal')
  }
  if (appointmentId && section !== 'overview') next.searchParams.set('section', section)
  else next.searchParams.delete('section')
  return next
}
