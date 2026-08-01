import { describe, expect, it } from 'vitest'
import { cleanViewingNotesForDocument } from './viewing-documents'

describe('cleanViewingNotesForDocument', () => {
  it('keeps normal notes unchanged', () => {
    expect(cleanViewingNotesForDocument('Clientul prefera dupa ora 18:00.')).toBe('Clientul prefera dupa ora 18:00.')
  })

  it('turns ClientFlow JSON into a safe document summary', () => {
    const notes = `[ClientFlow] ${JSON.stringify({
      values: {
        fullName: 'Demo Client',
        idDocument: 'CI seria XX nr. 000000',
        address: 'Str. Demo 1',
        email: 'demo@example.com',
        phone: '0700000000',
        moveInDate: '2026-09-01',
        occupants: 2,
        hasPets: true,
        notes: 'Prefer balcon inchis.',
      },
    })}`

    const cleaned = cleanViewingNotesForDocument(notes)

    expect(cleaned).toContain('fluxul digital')
    expect(cleaned).toContain('Data estimata de mutare: 2026-09-01')
    expect(cleaned).toContain('Numar persoane: 2')
    expect(cleaned).toContain('Alte detalii client: Prefer balcon inchis.')
    expect(cleaned).not.toContain('CI seria')
    expect(cleaned).not.toContain('demo@example.com')
    expect(cleaned).not.toContain('0700000000')
    expect(cleaned).not.toContain('Str. Demo')
  })
})
