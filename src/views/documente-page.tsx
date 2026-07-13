'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Download, Trash2, Eye, CheckCircle2, X, Loader2, FolderOpen, Building2,
  CalendarDays, User, Upload, FileSignature,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { loadFromLS, saveToLS, generateId } from '@/lib/storage'
import { DOC_TYPE_LABELS, LS_KEYS } from '@/lib/constants'
import type { UploadedDocument, Vizionare } from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PageHero } from '@/components/layout/page-hero'
import {
  DocumentUploadArea,
  type DocumentUploadAreaRef,
} from '@/components/features/documents/document-upload-area'
import { DocumentCard } from '@/components/features/documents/document-card'
import type { DocType } from '@/components/features/documents/document-type-selector'

// ─── Constants ──────────────────────────────────────────────────────────

const LS_DOCS = LS_KEYS.DOCUMENTS
const LS_VIZIONARI = LS_KEYS.VIZIONARI
const LS_SELECTED_VIZIONARE = LS_KEYS.SELECTED_VIZIONARE

const RENTAL_CONTRACT_TEMPLATE = `CONTRACT DE INCHIRIERE

Nr. ___________ / ___________

Incheiat intre:
PARTILE:

1. PROPRIETARUL: _______________________________
   CNP: _______________________________________
   Adresa: _____________________________________
   Telefon: ____________________________________
   E-mail: _____________________________________

   denumit in continuare "PROPRIETARUL"

2. LOCATARUL: __________________________________
   CNP: _______________________________________
   Seria/Numar CI: _____________________________
   Adresa: _____________________________________
   Telefon: ____________________________________
   E-mail: _____________________________________

   denumit in continuare "LOCATARUL"

OBIECTUL CONTRACTULUI

Art. 1. PROPRIETARUL inchiriaza LOCATARULUI urmatoarea proprietate:
   - Adresa: ___________________________________
   - Tip: Apartament / Casa / Spatiu comercial
   - Suprafata: _______ mp
   - Numar camere: _______

Art. 2. Proprietatea este inchiriata in stare buna, curata si funcționala, echipata cu:
   _______________________________________________

DURATA CONTRACTULUI

Art. 3. Contractul este incheiat pe o perioada de _______ luni, incepand cu data
   de ___________ pana la data de ___________.

CHIRIA SI GAZDUIREA

Art. 4. Chiria lunara este de _______ EUR / RON, platibila in avans pana la
   data de 5 a fiecarei luni, prin transfer bancar sau numerar.

Art. 5. Depozitul de garantie este de _______ EUR / RON, achitat la semnarea
   contractului si restituit la finalizarea acestuia, cu exceptia cazului in care
   exista pagube sau datorii neachitate.

Art. 6. Cheltuielile de utilitati (electricitate, gaz, apa, internet, etc.) sunt
   suportate de LOCATAR.

OBLIGATIILE PARTILOR

Art. 7. PROPRIETARUL se obliga:
   a) Sa predea proprietatea in stare buna de utilizare
   b) Sa efectueze reparatiile necesare care nu sunt cauzate de LOCATAR
   c) Sa respecte confidentialitatea datelor personale ale LOCATARULUI

Art. 8. LOCATARUL se obliga:
   a) Sa foloseasca proprietatea exclusiv in scop locativ
   b) Sa plateasca chiria la timp
   c) Sa mentina proprietatea in stare buna
   d) Sa nu subinchirieze fara acordul scris al PROPRIETARULUI
   e) Sa permita accesul PROPRIETARULUI pentru inspectii, cu preaviz de 48h

REZILIEREA

Art. 9. Contractul poate fi reziliat de oricare parte cu un preaviz de 30 de zile,
   notificat in scris.

DISPOZITII FINALE

Art. 10. Orice modificari ale prezentului contract se fac prin act aditional
   semnat de ambele parti.

Art. 11. Litigiile se vor solutiona pe cale amiabila, iar in caz de nerezolvare,
   de catre instantele judecatoresti competente.


SEMNATURI:

PROPRIETARUL                    LOCATARUL
_______________                 _______________
(Nume, Prenume)                 (Nume, Prenume)
Data: ___/___/______            Data: ___/___/______
`

// ─── Page Component ────────────────────────────────────────────────────

export function DocumentePage() {
  // ── State ────────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<UploadedDocument[]>(() => {
    if (typeof window === 'undefined') return []
    return loadFromLS<UploadedDocument[]>(LS_DOCS, [])
  })
  const [allVizionari] = useState<Vizionare[]>(() => {
    if (typeof window === 'undefined') return []
    return loadFromLS<Vizionare[]>(LS_VIZIONARI, [])
  })
  const [vizionare, setVizionare] = useState<Vizionare | null>(() => {
    if (typeof window === 'undefined') return null
    const selectedId = loadFromLS<string | null>(LS_SELECTED_VIZIONARE, null)
    if (!selectedId) return null
    const vizionari = loadFromLS<Vizionare[]>(LS_VIZIONARI, [])
    return vizionari.find((v) => v.id === selectedId) ?? null
  })
  const [contractSigning, setContractSigning] = useState(false)
  const [mounted] = useState(() => typeof window !== 'undefined')
  const uploadAreaRef = useRef<DocumentUploadAreaRef>(null)

  // ── Persist documents ────────────────────────────────────────────────
  const persistDocuments = useCallback((newDocs: UploadedDocument[]) => {
    setDocuments(newDocs)
    saveToLS(LS_DOCS, newDocs)
  }, [])

  // ── Derived data ─────────────────────────────────────────────────────
  const currentDocs = useMemo(
    () => (vizionare ? documents.filter((d) => d.vizionareId === vizionare.id) : []),
    [documents, vizionare],
  )

  const docsByVizionare = useMemo(() => {
    if (vizionare) return []
    const groups: Record<string, UploadedDocument[]> = {}
    documents.forEach((d) => {
      if (!groups[d.vizionareId]) groups[d.vizionareId] = []
      groups[d.vizionareId].push(d)
    })
    return Object.entries(groups).map(([vizId, docs]) => {
      const v = allVizionari.find((viz) => viz.id === vizId)
      return { vizionareId: vizId, vizionare: v ?? null, documents: docs }
    })
  }, [documents, allVizionari, vizionare])

  const uploadedTypes = useMemo(() => {
    if (!vizionare) return new Set<DocType>()
    return new Set(currentDocs.map((d) => d.docType))
  }, [currentDocs, vizionare])

  // ── Upload handler (called by DocumentUploadArea when file is ready) ─
  const handleFileReady = useCallback(
    (docType: DocType, fileData: string, fileName: string, fileType: string) => {
      if (!vizionare) {
        toast.error('Selecteaza o vizionare pentru a incarca documente')
        return
      }

      const newDoc: UploadedDocument = {
        id: generateId(),
        vizionareId: vizionare.id,
        fileName,
        fileType,
        fileData,
        filePreview: fileData,
        docType,
        uploadedAt: new Date().toISOString(),
      }

      // Replace existing doc of same type for this vizionare
      const filtered = documents.filter(
        (d) => !(d.vizionareId === vizionare.id && d.docType === docType),
      )

      persistDocuments([...filtered, newDoc])
      toast.success('Document incarcat cu succes!')
    },
    [vizionare, documents, persistDocuments],
  )

  // ── Document actions ─────────────────────────────────────────────────
  const handleViewDocument = (doc: UploadedDocument) => {
    const safeName = doc.fileName
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    const isImage = doc.fileType.startsWith('image/')
    const isPdf = doc.fileType === 'application/pdf'
    const win = window.open('')
    if (win) {
      if (isPdf) {
        win.document.write(`
          <!DOCTYPE html><html><head><title>${safeName}</title></head>
          <body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f5;">
            <iframe src="${doc.filePreview}" style="width:100%;height:100vh;border:none;"></iframe>
          </body></html>`)
      } else if (isImage) {
        win.document.write(`
          <!DOCTYPE html><html><head><title>${safeName}</title></head>
          <body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f5;">
            <img src="${doc.filePreview}" style="max-width:100%;max-height:100vh;" alt="${safeName}" />
          </body></html>`)
      } else {
        win.document.write(`
          <!DOCTYPE html><html><head><title>${safeName}</title></head>
          <body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f5;">
            <p style="font-family:sans-serif;color:#666;">Previzualizare nu este disponibila pentru acest tip de fisier.</p>
          </body></html>`)
      }
      win.document.close()
    }
  }

  const handleDownloadDocument = (doc: UploadedDocument) => {
    const link = document.createElement('a')
    link.href = doc.filePreview
    link.download = doc.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDeleteDocument = (docId: string) => {
    persistDocuments(documents.filter((d) => d.id !== docId))
    toast.success('Document sters')
  }

  // ── Contract actions ─────────────────────────────────────────────────
  const handleDownloadContract = () => {
    let contractText = RENTAL_CONTRACT_TEMPLATE
    if (vizionare) {
      contractText = contractText.replace(
        '   - Adresa: ___________________________________',
        `   - Adresa: ${vizionare.propertyTitle}`,
      )
    }
    const blob = new Blob([contractText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `contract_inchiriere_${vizionare?.id ?? 'template'}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Contract descarcat!')
  }

  const handleSignContract = () => {
    setContractSigning(true)
    setTimeout(() => {
      uploadAreaRef.current?.triggerUpload('rental_contract')
      setContractSigning(false)
    }, 100)
  }

  // ── Navigation ───────────────────────────────────────────────────────
  const handleSelectVizionare = (vizId: string) => {
    saveToLS(LS_SELECTED_VIZIONARE, vizId)
    const found = allVizionari.find((v) => v.id === vizId) ?? null
    setVizionare(found)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToAll = () => {
    saveToLS(LS_SELECTED_VIZIONARE, null)
    setVizionare(null)
  }

  // ── Guard ────────────────────────────────────────────────────────────
  if (!mounted) return null

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <>
      <PageHero
        icon={FileText}
        title="Documente"
        description="Incarca si gestioneaza documentele necesare pentru vizionari si contracte"
        breadcrumb={[{ label: 'Acasa', page: 'acasa' }, { label: 'Documente' }]}
      />

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* No vizionare selected — show all docs grouped */}
          {!vizionare ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Toate Documentele</h2>
                <Badge variant="secondary" className="ml-1">
                  {documents.length}
                </Badge>
              </div>

              {docsByVizionare.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground font-medium">Nu exista documente incarcate</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Selecteaza o vizionare din sectiunea de programari pentru a incarca documente
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {docsByVizionare.map((group) => (
                    <Card key={group.vizionareId} className="hover:shadow-md transition-shadow">
                      <CardHeader
                        className="cursor-pointer pb-3"
                        onClick={() => handleSelectVizionare(group.vizionareId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base">
                                {group.vizionare?.propertyTitle ?? 'Vizionare stearsa'}
                              </CardTitle>
                              {group.vizionare && (
                                <CardDescription className="text-xs">
                                  <CalendarDays className="h-3 w-3 inline mr-1" />
                                  {group.vizionare.date} · {group.vizionare.startTime}–{group.vizionare.endTime}
                                  {' · '}
                                  <User className="h-3 w-3 inline mr-1" />
                                  {group.vizionare.staffName}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary">{group.documents.length} doc</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2">
                          {group.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-xs font-medium">{DOC_TYPE_LABELS[doc.docType]}</span>
                              <span className="text-[10px] text-muted-foreground">{doc.fileName}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewDocument(doc)
                                }}
                                className="text-muted-foreground hover:text-foreground"
                                aria-label={`Vezi ${doc.fileName}`}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            /* Vizionare selected — show upload section + docs */
            <>
              {/* Vizionare context bar */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card rounded-xl p-4 mb-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-sm">{vizionare.propertyTitle}</h2>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {vizionare.date}, {vizionare.startTime}–{vizionare.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {vizionare.staffName}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0',
                            vizionare.status === 'completed' && 'border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950/30',
                            vizionare.status === 'confirmed' && 'border-blue-200 text-blue-600 bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:bg-blue-950/30',
                            vizionare.status === 'pending' && 'border-amber-200 text-amber-600 bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:bg-amber-950/30',
                            vizionare.status === 'cancelled' && 'border-red-200 text-red-600 bg-red-50 dark:border-red-800 dark:text-red-400 dark:bg-red-950/30',
                          )}
                        >
                          {vizionare.status === 'pending' && 'In asteptare'}
                          {vizionare.status === 'confirmed' && 'Confirmata'}
                          {vizionare.status === 'completed' && 'Finalizata'}
                          {vizionare.status === 'cancelled' && 'Anulata'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleBackToAll}>
                    <X className="h-4 w-4 mr-1" />
                    Inapoi
                  </Button>
                </div>
              </motion.div>

              {/* Document Upload Section */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <DocumentUploadArea
                  ref={uploadAreaRef}
                  uploadedTypes={uploadedTypes}
                  onFileReady={handleFileReady}
                />
              </motion.div>

              {/* Rental Contract Section — shown when completed */}
              {vizionare.status === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <FileSignature className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">Contract de Inchiriere</h2>
                  </div>

                  <Card className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Sabloan Contract</CardTitle>
                      <CardDescription>
                        Descarca sablonul, semneaza-l, apoi incarca versiunea semnata
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-lg border bg-muted/30 p-4 max-h-64 overflow-y-auto">
                        <pre className="text-[11px] leading-relaxed text-muted-foreground font-mono whitespace-pre-wrap">
                          {RENTAL_CONTRACT_TEMPLATE.slice(0, 800)}...
                        </pre>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={handleDownloadContract}>
                          <Download className="h-4 w-4 mr-1.5" />
                          Descarca Contract
                        </Button>
                        <Button onClick={handleSignContract} disabled={contractSigning}>
                          {contractSigning ? (
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          ) : (
                            <FileSignature className="h-4 w-4 mr-1.5" />
                          )}
                          Semneaza si Incarca
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Uploaded Documents List */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Documente Incarcate</h2>
                  <Badge variant="secondary" className="ml-1">
                    {currentDocs.length}
                  </Badge>
                </div>

                {currentDocs.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                      <Upload className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground font-medium text-sm">
                        Selecteaza o vizionare pentru a incarca documente
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      {/* Desktop table */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/30">
                              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Document
                              </th>
                              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Tip
                              </th>
                              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Dimensiune
                              </th>
                              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Data
                              </th>
                              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                                Actiuni
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {currentDocs.map((doc) => (
                              <DocumentCard
                                key={doc.id}
                                document={doc}
                                onView={handleViewDocument}
                                onDownload={handleDownloadDocument}
                                onDelete={handleDeleteDocument}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards */}
                      <div className="sm:hidden divide-y">
                        {currentDocs.map((doc) => (
                          <DocumentCard
                            key={doc.id}
                            document={doc}
                            onView={handleViewDocument}
                            onDownload={handleDownloadDocument}
                            onDelete={handleDeleteDocument}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </>
          )}
        </div>
      </section>
    </>
  )
}