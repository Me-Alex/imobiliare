'use client'

import { Button } from '@/components/ui/button'
import type { DocumentFlowSummary } from '@/lib/document-flow'

const PRIMARY_ACTION_LABELS: Record<DocumentFlowSummary['action']['type'], string> = {
  SIGN: 'Verifică și semnează',
  EXTERNAL_SIGNATURE: 'Vezi pașii de semnare',
  EDIT_REQUEST: 'Completează informațiile',
  CREATE_REQUEST: 'Completează datele pentru agent',
  GENERATE_DOCUMENT: 'Verifică și generează',
  UPLOAD_IDENTITY: 'Încarcă documentul',
  OPEN_TOOLS: 'Vezi starea solicitării',
  OPEN_ARCHIVE: 'Vezi documentele',
}

export function DocumentActionCenter({ summary, onPrimaryAction, primaryLabel }: {
  summary: DocumentFlowSummary
  primaryLabel?: string
  onPrimaryAction: () => void
}) {
  const collecting = summary.action.type === 'CREATE_REQUEST'
  const waiting = summary.action.type === 'OPEN_TOOLS' && Boolean(summary.action.request)
  const title = collecting ? 'Completează datele pentru agent' : waiting ? 'Agentul verifică datele trimise' : summary.action.label
  const description = collecting
    ? 'Agentul folosește datele tale pentru a pregăti documentul. Îl vei putea citi înainte de semnare.'
    : waiting ? 'Nu trebuie să trimiți din nou datele. Aici vei vedea eventualele completări cerute și documentul pregătit.'
      : summary.action.description
  return <section id="document-simple-actions" data-testid="document-action-center" className="mb-6 scroll-mt-24 border-b pb-5">
    <h2 className="text-lg font-semibold">{title}</h2>
    <p className="mt-2 max-w-prose text-sm text-muted-foreground">{description}</p>
    <Button className="mt-4 h-auto min-h-11 whitespace-normal" variant={summary.readOnly ? 'outline' : 'default'} onClick={onPrimaryAction}>{primaryLabel || PRIMARY_ACTION_LABELS[summary.action.type]}</Button>
  </section>
}
