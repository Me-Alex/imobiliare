'use client'

/**
 * Preview route for the new documents workspace.
 *
 * This page lives under the `_dev` folder, which Next.js excludes from
 * the public navigation. It is meant for visual review only — wire it
 * into the real `/documente` page once the design is approved.
 *
 * Uses mock data so the new components can be inspected in isolation
 * from the legacy viewing-documents / legal-documents / legal-document-requests
 * state.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DocumentWorkspace,
  type IdentityValue,
  type TimelineItem,
} from '@/components/documents-v2'
import type { DocumentStatus } from '@/lib/documents/types'

const MOCK_DOCUMENTS: TimelineItem[] = [
  {
    id: 'd1',
    status: 'IN_REVIEW' as DocumentStatus,
    card: {
      title: 'Contract de intermediere',
      subtitle: 'Versiunea 1 · creat de client',
      meta: (
        <>
          <span>Trimis ieri la 14:32</span>
          <span aria-hidden>·</span>
          <span>Etapa: Negociere</span>
        </>
      ),
      action: (
        <Button size="sm" variant="outline">
          Deschide
        </Button>
      ),
    },
  },
  {
    id: 'd2',
    status: 'NEEDS_INFO' as DocumentStatus,
    card: {
      title: 'Extras de carte funciară',
      subtitle: 'Versiunea 1 · returnat cu observații',
      meta: (
        <>
          <span className="text-amber-700">Necesită completare</span>
          <span aria-hidden>·</span>
          <span>Notă: număr cadastral lipsă</span>
        </>
      ),
      action: (
        <Button size="sm">
          Completează
        </Button>
      ),
    },
  },
  {
    id: 'd3',
    status: 'READY_TO_SIGN' as DocumentStatus,
    card: {
      title: 'Ofertă de rezervare',
      subtitle: 'Versiunea 2 · gata de semnare',
      meta: (
        <>
          <span>Suma: 3.000 EUR</span>
          <span aria-hidden>·</span>
          <span>2 semnături rămase</span>
        </>
      ),
      action: (
        <Button size="sm">
          Semnează
        </Button>
      ),
    },
  },
  {
    id: 'd4',
    status: 'PARTIALLY_SIGNED' as DocumentStatus,
    card: {
      title: 'Contract de închiriere',
      subtitle: 'Versiunea 1 · 1 din 2 semnături',
      meta: (
        <>
          <span>Proprietar a semnat</span>
          <span aria-hidden>·</span>
          <span>Client: în așteptare</span>
        </>
      ),
      action: (
        <Button size="sm" variant="outline">
          Status
        </Button>
      ),
    },
  },
  {
    id: 'd5',
    status: 'APPROVED' as DocumentStatus,
    card: {
      title: 'Raport de vizionare',
      subtitle: 'Vizionare 12 iulie',
      meta: <span>Aprobat acum 3 zile</span>,
    },
  },
  {
    id: 'd6',
    status: 'CANCELLED' as DocumentStatus,
    card: {
      title: 'Proces verbal de predare (anulat)',
      subtitle: 'Anulat — proprietarul a renunțat',
      meta: <span>Închis acum o săptămână</span>,
    },
  },
  {
    id: 'd7',
    status: 'DRAFT' as DocumentStatus,
    card: {
      title: 'Anexă contractuală',
      subtitle: 'Ciornă · netrimisă',
      meta: <span>Salvat acum 2 ore</span>,
      action: (
        <Button size="sm" variant="outline">
          Continuă
        </Button>
      ),
    },
  },
]

const MOCK_IDENTITY: IdentityValue = {
  fullName: 'Maria Ionescu',
  idDocument: 'CI YY 000099',
  address: 'Bd. Magheru 14, București',
  email: 'maria@exemplu.ro',
  phone: '+40 722 123 456',
}

export default function DocumentsV2Preview() {
  const [identity, setIdentity] = useState<IdentityValue | null>(MOCK_IDENTITY)
  // Mutable copies so the timeline can be edited in the preview.
  const [items, setItems] = useState<TimelineItem[]>(MOCK_DOCUMENTS)

  function advance(id: string, to: DocumentStatus) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: to } : it)))
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto mb-6 max-w-3xl rounded-md border border-dashed border-border/80 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        <strong className="font-medium text-foreground">Preview route.</strong>{' '}
        This is a working preview of the redesigned documents workspace.
        Not wired into the public navigation. Use the buttons below to
        move documents between states and see the timeline update.
      </div>

      <div className="mx-auto mb-6 flex max-w-3xl flex-wrap gap-2 text-xs">
        <span className="text-muted-foreground">Mută ultimul document:</span>
        {(['DRAFT', 'IN_REVIEW', 'READY_TO_SIGN', 'APPROVED', 'CANCELLED'] as DocumentStatus[]).map(
          (status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              onClick={() => advance('d7', status)}
            >
              → {status}
            </Button>
          ),
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setItems(MOCK_DOCUMENTS)}
        >
          Reset
        </Button>
      </div>

      <DocumentWorkspace
        summary={{
          propertyTitle: 'Apartament 3 camere, Dorobanți',
          propertyZone: 'Sector 1, București',
          transactionType: 'SALE',
          transactionStage: 'NEGOTIATION',
        }}
        identity={{
          role: 'CLIENT',
          value: identity,
          onSave: async (next) => {
            // Mock: simulate a 400 ms network round trip.
            await new Promise((r) => setTimeout(r, 400))
            setIdentity(next)
          },
        }}
        documents={items}
        heroAction={
          <Button variant="outline" size="sm">
            Vezi proprietatea
          </Button>
        }
      />
    </main>
  )
}
