import { describe, expect, it } from 'vitest'
import { documentSectionUrl, readDocumentSection } from './document-section-navigation'

describe('document section navigation', () => {
  it('keeps the transaction and dossier when changing sections', () => {
    const url = documentSectionUrl(new URL('https://example.test/?page=documente&appointment=a&deal=d&focus=primary'), 'a', 'files')
    expect(url.searchParams.get('deal')).toBe('d')
    expect(url.searchParams.get('appointment')).toBe('a')
    expect(url.searchParams.has('focus')).toBe(false)
    expect(readDocumentSection(url)).toBe('files')
  })
  it('removes dossier-specific context when returning to the chooser', () => {
    const url = documentSectionUrl(new URL('https://example.test/?page=documente&appointment=a&deal=d&section=upload'), null)
    expect(url.search).toBe('?page=documente')
  })
  it('falls back to the overview for unsupported sections', () => {
    expect(readDocumentSection(new URL('https://example.test/?section=unknown'))).toBe('overview')
    expect(readDocumentSection(new URL('https://example.test/'))).toBe('overview')
  })
  it('returns to a clean overview without changing the input URL', () => {
    const input = new URL('https://example.test/?page=documente&appointment=a&section=files')
    const url = documentSectionUrl(input, 'a')
    expect(url.searchParams.has('section')).toBe(false)
    expect(input.searchParams.get('section')).toBe('files')
  })
})
