import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  clearDocumentFocusContext,
  openDealRoomForViewing,
  openViewingDocuments,
  readDocumentFocusContext,
  selectDocumentAppointment,
} from '@/lib/document-navigation'
import type { PageKey } from '@/store/use-app-store'

function createLocalStorageMock() {
  const values = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value) }),
    removeItem: vi.fn((key: string) => { values.delete(key) }),
    clear: vi.fn(() => { values.clear() }),
  }
}

function installWindow(initialHref = 'https://hqs.test/?page=deal-room') {
  let href = initialHref
  const localStorage = createLocalStorageMock()
  const history = {
    state: null as unknown,
    replaceState: vi.fn((state: unknown, _title: string, nextUrl: string) => {
      history.state = state
      href = new URL(nextUrl, 'https://hqs.test').href
    }),
  }
  const location = {
    get href() { return href },
    set href(value: string) { href = value },
    get pathname() { return new URL(href).pathname },
    get search() { return new URL(href).search },
    origin: 'https://hqs.test',
  }

  vi.stubGlobal('localStorage', localStorage)
  vi.stubGlobal('window', { history, location, localStorage })

  return { history, localStorage }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('document-navigation focus context', () => {
  it('opens the document workspace with a focused simple action', () => {
    installWindow()
    const navigate = vi.fn<(page: PageKey) => void>()

    openViewingDocuments(navigate, 'appointment-1', 'deal-1', { focus: 'primary' })

    expect(navigate).toHaveBeenCalledWith('documente')
    expect(readDocumentFocusContext()).toBe('primary')
    expect(window.location.href).toContain('appointment=appointment-1')
    expect(window.location.href).toContain('deal=deal-1')
    expect(window.location.href).toContain('focus=primary')
  })

  it('preserves focus while selecting the same document appointment', () => {
    installWindow()
    const navigate = vi.fn<(page: PageKey) => void>()

    openViewingDocuments(navigate, 'appointment-1', 'deal-1', { focus: 'advanced' })
    selectDocumentAppointment('appointment-1', 'deal-1')

    expect(readDocumentFocusContext()).toBe('advanced')
    expect(window.location.href).toContain('focus=advanced')
  })

  it('clears document focus after it is consumed or when leaving for Deal Room', () => {
    installWindow()
    const navigate = vi.fn<(page: PageKey) => void>()

    openViewingDocuments(navigate, 'appointment-1', 'deal-1', { focus: 'archive' })
    clearDocumentFocusContext()
    expect(readDocumentFocusContext()).toBeNull()

    openViewingDocuments(navigate, 'appointment-1', 'deal-1', { focus: 'primary' })
    openDealRoomForViewing(navigate, 'appointment-1', 'deal-1')
    expect(readDocumentFocusContext()).toBeNull()
  })
})
