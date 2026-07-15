'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  FileSignature,
  FileText,
  FolderLock,
  Loader2,
  RefreshCw,
  ShieldCheck,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageHero } from '@/components/layout/page-hero'
import {
  DocumentUploadArea,
  type DocumentUploadAreaRef,
} from '@/components/features/documents/document-upload-area'
import { DocumentCard } from '@/components/features/documents/document-card'
import type { DocType } from '@/components/features/documents/document-type-selector'
import type { DocumentSigner, ViewingDocument, Vizionare } from '@/lib/types'
import { DOC_TYPE_LABELS, LS_KEYS } from '@/lib/constants'
import { loadFromLS, saveToLS } from '@/lib/storage'
import {
  createDocumentUrl,
  deleteViewingDocument,
  generateViewingDocument,
  listViewingDocuments,
  listViewings,
  signViewingDocument,
  uploadViewingDocument,
} from '@/lib/viewing-documents'
import { formatDateRO } from '@/lib/utils'

const ROLE_COPY = {
  CLIENT: 'Incarca actele solicitate, genereaza documentele vizionarii si semneaza-le in siguranta.',
  OWNER: 'Vezi si semneaza documentele partajate pentru proprietatile tale.',
  AGENT: 'Pregateste dosarele vizionarilor alocate si urmareste semnaturile participantilor.',
  ADMIN: 'Administreaza documentele, contractele si jurnalul de audit al tuturor vizionarilor.',
} as const

interface SigningState {
  document: ViewingDocument
  signer: DocumentSigner
}

export function DocumentePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigateTo = useAppStore((state) => state.navigateTo)
  const uploadAreaRef = useRef<DocumentUploadAreaRef>(null)
  const [viewings, setViewings] = useState<Vizionare[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [documents, setDocuments] = useState<ViewingDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [generating, setGenerating] = useState<'viewing_report' | 'rental_contract' | null>(null)
  const [signing, setSigning] = useState<SigningState | null>(null)
  const [signatureName, setSignatureName] = useState('')
  const [signatureAccepted, setSignatureAccepted] = useState(false)
  const [signingBusy, setSigningBusy] = useState(false)

  const selectedViewing = useMemo(
    () => viewings.find((viewing) => viewing.id === selectedId) ?? null,
    [selectedId, viewings],
  )

  const canCreateDocuments = profile?.role === 'CLIENT' || profile?.role === 'AGENT' || profile?.role === 'ADMIN'
  const uploadedTypes = useMemo(
    () => new Set(documents.filter((document) => document.status !== 'SUPERSEDED').map((document) => document.docType)),
    [documents],
  )

  const refreshDocuments = useCallback(async (appointmentId: string) => {
    setDocumentsLoading(true)
    try {
      setDocuments(await listViewingDocuments(appointmentId))
    } catch (error) {
      toast.error('Documentele nu au putut fi incarcate.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setDocumentsLoading(false)
    }
  }, [])

  const refreshViewings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const rows = await listViewings()
      setViewings(rows)
      const storedId = loadFromLS<string | null>(LS_KEYS.SELECTED_VIZIONARE, null)
      const nextId = rows.some((row) => row.id === storedId) ? storedId : rows[0]?.id || null
      setSelectedId(nextId)
    } catch (error) {
      toast.error('Vizionarile nu au putut fi incarcate.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) queueMicrotask(() => void refreshViewings())
  }, [user, refreshViewings])

  useEffect(() => {
    if (!selectedId) {
      queueMicrotask(() => setDocuments([]))
      return
    }
    saveToLS(LS_KEYS.SELECTED_VIZIONARE, selectedId)
    queueMicrotask(() => void refreshDocuments(selectedId))
  }, [selectedId, refreshDocuments])

  const handleFileReady = useCallback(async (docType: DocType, file: File) => {
    if (!user || !selectedViewing) throw new Error('Selecteaza o vizionare.')
    try {
      await uploadViewingDocument({ user, viewing: selectedViewing, docType, file })
      await refreshDocuments(selectedViewing.id)
      toast.success('Document incarcat in dosarul privat.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Incarcarea a esuat.'
      toast.error('Documentul nu a putut fi incarcat.', { description: message })
      throw error
    }
  }, [refreshDocuments, selectedViewing, user])

  const handleGenerate = async (kind: 'viewing_report' | 'rental_contract') => {
    if (!user || !selectedViewing) return
    if (!selectedViewing.clientId) {
      toast.error('Vizionarea nu este legata de un profil de client.', {
        description: 'Un administrator trebuie sa asocieze clientul inainte de generarea documentului.',
      })
      return
    }

    setGenerating(kind)
    try {
      await generateViewingDocument(kind, user, selectedViewing)
      await refreshDocuments(selectedViewing.id)
      toast.success(kind === 'viewing_report' ? 'Fisa de vizionare a fost generata.' : 'Modelul de contract a fost generat.')
    } catch (error) {
      toast.error('PDF-ul nu a putut fi generat.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setGenerating(null)
    }
  }

  const handleView = async (document: ViewingDocument) => {
    const preview = window.open('about:blank', '_blank')
    try {
      const url = await createDocumentUrl(document)
      if (preview) {
        preview.opener = null
        preview.location.href = url
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      preview?.close()
      toast.error(error instanceof Error ? error.message : 'Documentul nu poate fi deschis.')
    }
  }

  const handleDownload = async (document: ViewingDocument) => {
    try {
      const url = await createDocumentUrl(document, true)
      const link = window.document.createElement('a')
      link.href = url
      link.download = document.fileName
      link.rel = 'noopener'
      link.click()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Documentul nu poate fi descarcat.')
    }
  }

  const handleDelete = async (document: ViewingDocument) => {
    if (!selectedViewing) return
    try {
      await deleteViewingDocument(document)
      await refreshDocuments(selectedViewing.id)
      toast.success('Document sters din dosar.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Documentul nu poate fi sters.')
    }
  }

  const openSigningDialog = (document: ViewingDocument, signer: DocumentSigner) => {
    setSigning({ document, signer })
    setSignatureName(profile?.fullName || user?.email?.split('@')[0] || '')
    setSignatureAccepted(false)
  }

  const handleSign = async () => {
    if (!signing || !user || !selectedViewing) return
    if (signatureName.trim().length < 3 || !signatureAccepted) return
    setSigningBusy(true)
    try {
      await signViewingDocument(signing.signer.id, user.id, signatureName)
      await refreshDocuments(selectedViewing.id)
      setSigning(null)
      toast.success('Semnatura a fost inregistrata in jurnalul documentului.')
    } catch (error) {
      toast.error('Documentul nu a putut fi semnat.', {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setSigningBusy(false)
    }
  }

  if (authLoading) {
    return <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (!user || !profile) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><User className="h-6 w-6" /></div>
            <CardTitle>Autentifica-te</CardTitle>
            <CardDescription>Documentele sunt disponibile numai utilizatorilor autentificati.</CardDescription>
          </CardHeader>
          <CardContent><Button onClick={() => navigateTo('login')}>Autentificare</Button></CardContent>
        </Card>
      </div>
    )
  }

  const pendingForUser = documents.filter((document) => document.signers.some((signer) => signer.userId === user.id && signer.status === 'PENDING')).length
  const signedDocuments = documents.filter((document) => document.status === 'SIGNED').length

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <PageHero
          variant="simple"
          title="Dosar digital"
          description={ROLE_COPY[profile.role]}
          showBackButton
          onBack={() => navigateTo(profile.role === 'CLIENT' ? 'vizionarile-mele' : 'dashboard')}
          backLabel="Inapoi"
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Vizionari accesibile', value: viewings.length, icon: CalendarDays },
            { label: 'Documente', value: documents.length, icon: FileText },
            { label: 'De semnat de tine', value: pendingForUser, icon: FileSignature },
            { label: 'Dosare semnate', value: signedDocuments, icon: CheckCircle2 },
          ].map((stat) => (
            <Card key={stat.label} className="border-border/60">
              <CardContent className="p-4">
                <stat.icon className="h-4 w-4 text-primary mb-3" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : viewings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <FolderLock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="font-semibold">Nu exista vizionari asociate contului</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-5">Dosarul digital va fi creat dupa programarea unei vizionari.</p>
              {profile.role === 'CLIENT' && <Button onClick={() => navigateTo('programare-vizionare')}>Programeaza o vizionare</Button>}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Selecteaza vizionarea</CardTitle>
                    <CardDescription>Fiecare vizionare are propriul dosar si propriul jurnal.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => void refreshViewings()} className="gap-2">
                    <RefreshCw className="h-3.5 w-3.5" /> Actualizeaza
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedId || ''}
                  onChange={(event) => setSelectedId(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Vizionare selectata"
                >
                  {viewings.map((viewing) => (
                    <option key={viewing.id} value={viewing.id}>
                      {viewing.propertyTitle} - {formatDateRO(viewing.date)}, {viewing.startTime}
                    </option>
                  ))}
                </select>

                {selectedViewing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {selectedViewing.propertyTitle}</span>
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {formatDateRO(selectedViewing.date)}, {selectedViewing.startTime}-{selectedViewing.endTime}</span>
                    <Badge variant="outline">{selectedViewing.staffName}</Badge>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {selectedViewing && canCreateDocuments && (
              <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Documente generate in proiect</CardTitle>
                    <CardDescription>Datele vizionarii sunt completate automat intr-un PDF privat.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-3">
                    <Button variant="outline" className="h-auto py-4 justify-start gap-3" disabled={Boolean(generating)} onClick={() => void handleGenerate('viewing_report')}>
                      {generating === 'viewing_report' ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileCheck2 className="h-5 w-5 text-primary" />}
                      <span className="text-left"><span className="block font-medium">Genereaza fisa de vizionare</span><span className="block text-xs font-normal text-muted-foreground">Pregatita pentru semnare</span></span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 justify-start gap-3" disabled={Boolean(generating)} onClick={() => void handleGenerate('rental_contract')}>
                      {generating === 'rental_contract' ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileSignature className="h-5 w-5 text-primary" />}
                      <span className="text-left"><span className="block font-medium">Genereaza modelul de contract</span><span className="block text-xs font-normal text-muted-foreground">Model de lucru editabil ulterior</span></span>
                    </Button>
                  </CardContent>
                </Card>

                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertTitle>Semnatura electronica simpla</AlertTitle>
                  <AlertDescription>
                    Aplicatia salveaza identitatea, data, consimtamantul si hash-ul documentului. Nu este prezentata ca semnatura calificata eIDAS.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {selectedViewing && canCreateDocuments && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <DocumentUploadArea ref={uploadAreaRef} uploadedTypes={uploadedTypes} onFileReady={handleFileReady} />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><FolderLock className="h-4 w-4 text-primary" /> Documentele dosarului</CardTitle>
                <CardDescription>Fisiere private, disponibile numai participantilor autorizati.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {documentsLoading ? (
                  <div className="py-14 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : documents.length === 0 ? (
                  <div className="py-14 px-4 text-center text-sm text-muted-foreground">Nu exista documente in acest dosar.</div>
                ) : (
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b bg-muted/30 text-left"><th className="px-4 py-3 font-medium">Document</th><th className="px-4 py-3 font-medium">Tip</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Marime</th><th className="px-4 py-3 font-medium">Data</th><th className="px-4 py-3 font-medium text-right">Actiuni</th></tr></thead>
                        <tbody>{documents.map((document) => <DocumentCard key={document.id} document={document} currentUserId={user.id} canDelete={!document.lockedAt && document.userId === user.id && !['SIGNED', 'PARTIALLY_SIGNED'].includes(document.status)} onView={handleView} onDownload={handleDownload} onDelete={handleDelete} onSign={openSigningDialog} />)}</tbody>
                      </table>
                    </div>
                    <div className="md:hidden divide-y">{documents.map((document) => <DocumentCard key={document.id} document={document} currentUserId={user.id} canDelete={!document.lockedAt && document.userId === user.id && !['SIGNED', 'PARTIALLY_SIGNED'].includes(document.status)} onView={handleView} onDownload={handleDownload} onDelete={handleDelete} onSign={openSigningDialog} />)}</div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={Boolean(signing)} onOpenChange={(open) => !open && !signingBusy && setSigning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Semneaza documentul</DialogTitle>
            <DialogDescription>{signing?.document.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Hash document: <span className="font-mono break-all text-foreground">{signing?.document.checksum || 'indisponibil'}</span>
            </div>
            <div className="space-y-2">
              <label htmlFor="signature-name" className="text-sm font-medium">Numele complet</label>
              <Input id="signature-name" value={signatureName} onChange={(event) => setSignatureName(event.target.value)} autoComplete="name" />
            </div>
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={signatureAccepted} onChange={(event) => setSignatureAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
              <span>Confirm ca am citit documentul, ca datele sunt corecte si ca doresc sa il semnez electronic.</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={signingBusy} onClick={() => setSigning(null)}>Renunta</Button>
            <Button disabled={signingBusy || !signatureAccepted || signatureName.trim().length < 3} onClick={() => void handleSign()} className="gap-2">
              {signingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
              Semneaza
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
