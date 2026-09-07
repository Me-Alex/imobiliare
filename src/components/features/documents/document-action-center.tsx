'use client'

import { Button } from '@/components/ui/button'
import type { DocumentFlowSummary } from '@/lib/document-flow'

const PRIMARY_ACTION_LABELS: Record<DocumentFlowSummary['action']['type'], string> = {
  SIGN: 'Verifică și semnează',
  EXTERNAL_SIGNATURE: 'Vezi pașii de semnare',
  EDIT_REQUEST: 'Completează informațiile',
  CREATE_REQUEST: 'Începe documentul',
  GENERATE_DOCUMENT: 'Verifică și generează',
  UPLOAD_IDENTITY: 'Încarcă documentul',
  OPEN_TOOLS: 'Vezi starea solicitării',
  OPEN_ARCHIVE: 'Vezi arhiva',
}

export function DocumentActionCenter({ summary, onPrimaryAction }: {
  summary: DocumentFlowSummary
  onPrimaryAction: () => void
}) {
  return <section id="document-simple-actions" data-testid="document-action-center" className="mb-6 scroll-mt-24 border-y py-5">
    <h2 className="text-lg font-semibold">{summary.action.label}</h2>
    <p className="mt-2 max-w-prose text-sm text-muted-foreground">{summary.action.description}</p>
    <Button className="mt-4 h-auto min-h-11 whitespace-normal" variant={summary.readOnly ? 'outline' : 'default'} onClick={onPrimaryAction}>{PRIMARY_ACTION_LABELS[summary.action.type]}</Button>
  </section>
}
