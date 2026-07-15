'use client'

import { useState } from 'react'
import { AlertCircle, ClipboardList, FilePenLine, Loader2, Send, UserCheck, XCircle } from 'lucide-react'
import type { AccountRole } from '@/lib/account-roles'
import {
  getLegalDocumentDefinition,
  getLegalRequestKindsForRole,
  type LegalDocumentKind,
} from '@/lib/legal-documents'
import type { LegalDocumentRequest, LegalDocumentRequestStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

const STATUS_LABELS: Record<LegalDocumentRequestStatus, string> = {
  REQUESTED: 'Trimisă',
  IN_REVIEW: 'În verificare',
  NEEDS_INFO: 'Necesită completări',
  FULFILLED: 'Document generat',
  CANCELLED: 'Anulată',
  REJECTED: 'Respinsă',
}

function requestName(request: LegalDocumentRequest): string {
  return request.submittedData.client_name
    || request.submittedData.owner_name
    || 'Participant'
}

interface LegalDocumentRequestPanelProps {
  role: AccountRole
  requests: LegalDocumentRequest[]
  busyId?: string | null
  onCreate: (kind: Exclude<LegalDocumentKind, 'viewing_report'>) => void
  onEdit: (request: LegalDocumentRequest) => void
  onCancel: (request: LegalDocumentRequest) => Promise<void> | void
  onStaffStatus: (request: LegalDocumentRequest, status: 'NEEDS_INFO' | 'REJECTED', note: string) => Promise<void> | void
}

export function LegalDocumentRequestPanel({
  role,
  requests,
  busyId,
  onCreate,
  onEdit,
  onCancel,
  onStaffStatus,
}: LegalDocumentRequestPanelProps) {
  const participantRole = role === 'CLIENT' || role === 'OWNER' ? role : null
  const [staffAction, setStaffAction] = useState<{
    request: LegalDocumentRequest
    status: 'NEEDS_INFO' | 'REJECTED'
  } | null>(null)
  const [staffNote, setStaffNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const runStaffAction = async () => {
    if (!staffAction || staffNote.trim().length < 3) return
    setSubmitting(true)
    try {
      await onStaffStatus(staffAction.request, staffAction.status, staffNote)
      setStaffAction(null)
      setStaffNote('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {participantRole && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {participantRole === 'CLIENT' ? <Send className="h-4 w-4 text-primary" /> : <UserCheck className="h-4 w-4 text-primary" />}
              {participantRole === 'CLIENT' ? 'Solicită un document' : 'Confirmă datele proprietarului'}
            </CardTitle>
            <CardDescription>
              {participantRole === 'CLIENT'
                ? 'Completezi datele și trimiți solicitarea; agentul alocat generează documentul.'
                : 'Datele proprietății și ale proprietarului sunt confirmate separat înainte de generare.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {getLegalRequestKindsForRole(participantRole).map((kind) => {
              const definition = getLegalDocumentDefinition(kind)
              const current = requests.find((request) =>
                request.documentKind === kind && ['REQUESTED', 'IN_REVIEW', 'NEEDS_INFO'].includes(request.status),
              )
              const editable = current && ['REQUESTED', 'NEEDS_INFO'].includes(current.status)
              return (
                <Button
                  key={kind}
                  variant="outline"
                  className="h-auto min-h-20 justify-between gap-3 py-4 whitespace-normal"
                  disabled={Boolean(current && !editable)}
                  onClick={() => editable ? onEdit(current) : onCreate(kind as Exclude<LegalDocumentKind, 'viewing_report'>)}
                >
                  <span className="text-left">
                    <span className="block font-medium">{definition.shortTitle}</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {current ? STATUS_LABELS[current.status] : definition.description}
                    </span>
                  </span>
                  {editable ? <FilePenLine className="h-4 w-4 shrink-0" /> : <Send className="h-4 w-4 shrink-0" />}
                </Button>
              )
            })}
          </CardContent>
        </Card>
      )}

      {requests.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Solicitări și confirmări
            </CardTitle>
            <CardDescription>Istoricul datelor furnizate înainte de generarea documentelor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.map((request) => {
              const definition = getLegalDocumentDefinition(request.documentKind)
              const isBusy = busyId === request.id
              return (
                <div key={request.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{definition.shortTitle}</p>
                        <Badge variant={request.status === 'NEEDS_INFO' ? 'destructive' : 'outline'}>
                          {STATUS_LABELS[request.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {requestName(request)} · {new Date(request.createdAt).toLocaleString('ro-RO')}
                      </p>
                      {request.staffNote && (
                        <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {request.staffNote}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {participantRole && ['REQUESTED', 'NEEDS_INFO'].includes(request.status) && (
                        <>
                          <Button size="sm" variant="outline" disabled={isBusy} onClick={() => onEdit(request)}>Editează</Button>
                          <Button size="sm" variant="ghost" disabled={isBusy} onClick={() => void onCancel(request)}>
                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Anulează'}
                          </Button>
                        </>
                      )}
                      {!participantRole && ['REQUESTED', 'IN_REVIEW'].includes(request.status) && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setStaffAction({ request, status: 'NEEDS_INFO' })
                              setStaffNote('')
                            }}
                          >
                            Cere completări
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              setStaffAction({ request, status: 'REJECTED' })
                              setStaffNote('')
                            }}
                          >
                            <XCircle className="mr-1.5 h-4 w-4" /> Respinge
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(staffAction)} onOpenChange={(open) => !open && !submitting && setStaffAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{staffAction?.status === 'NEEDS_INFO' ? 'Solicită completări' : 'Respinge solicitarea'}</DialogTitle>
            <DialogDescription>Explicația va fi vizibilă participantului și păstrată în audit.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={staffNote}
            rows={4}
            maxLength={2000}
            placeholder="Explică exact ce trebuie completat sau motivul respingerii."
            onChange={(event) => setStaffNote(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" disabled={submitting} onClick={() => setStaffAction(null)}>Renunță</Button>
            <Button disabled={submitting || staffNote.trim().length < 3} onClick={() => void runStaffAction()}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
