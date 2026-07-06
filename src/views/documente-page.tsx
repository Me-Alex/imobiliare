'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, ChevronRight, Upload, FileText, IdCard, FileSignature, FileCheck, File,
  Download, Trash2, Eye, AlertCircle, CheckCircle2, X, Loader2, FolderOpen, Building2,
  CalendarDays, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  loadFromLS, saveToLS, generateId, DOC_TYPE_LABELS,
  type UploadedDocument, type Vizionare,
} from '@/lib/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const LS_DOCS = 'hqs_documents'
const LS_VIZIONARI = 'hqs_vizionari'
const LS_SELECTED_VIZIONARE = 'hqs_selected_vizionare_id'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

type DocType = UploadedDocument['docType']

const DOC_TYPE_CONFIG: Array<{
  type: DocType
  icon: React.ElementType
  color: string
  bgColor: string
  description: string
}> = [
  {
    type: 'id_card',
    icon: IdCard,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    description: 'Copie CI/Passport',
  },
  {
    type: 'proof_of_income',
    icon: FileCheck,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    description: 'Adeverinta salariu / venit',
  },
  {
    type: 'vizionare_sign',
    icon: FileSignature,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    description: 'Semnatura proces-verbal vizionare',
  },
  {
    type: 'rental_contract',
    icon: FileText,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    description: 'Contract de inchiriere semnat',
  },
  {
    type: 'other',
    icon: File,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50 border-border',
    description: 'Alte documente necesare',
  },
]

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

function formatUploadDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function base64ToBytes(base64: string): number {
  // Remove data URL prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
  return Math.ceil((base64Data.length * 3) / 4)
}

export function DocumentePage() {
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
  const [uploadingType, setUploadingType] = useState<DocType | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [contractSigning, setContractSigning] = useState(false)
  const [mounted] = useState(() => typeof window !== 'undefined')
  const fileInputRefs = useRef<Record<DocType, HTMLInputElement | null>>({
    id_card: null,
    proof_of_income: null,
    vizionare_sign: null,
    rental_contract: null,
    other: null,
  })

  // Persist documents
  const persistDocuments = useCallback((newDocs: UploadedDocument[]) => {
    setDocuments(newDocs)
    saveToLS(LS_DOCS, newDocs)
  }, [])

  // Documents for current vizionare
  const currentDocs = useMemo(
    () => (vizionare ? documents.filter((d) => d.vizionareId === vizionare.id) : []),
    [documents, vizionare],
  )

  // Documents grouped by vizionare (when no vizionare selected)
  const docsByVizionare = useMemo(() => {
    if (vizionare) return []
    const groups: Record<string, UploadedDocument[]> = {}
    documents.forEach((d) => {
      if (!groups[d.vizionareId]) groups[d.vizionareId] = []
      groups[d.vizionareId].push(d)
    })
    return Object.entries(groups).map(([vizId, docs]) => {
      const v = allVizionari.find((viz) => viz.id === vizId)
      return {
        vizionareId: vizId,
        vizionare: v ?? null,
        documents: docs,
      }
    })
  }, [documents, allVizionari, vizionare])

  // Check if a doc type is already uploaded for current vizionare
  const uploadedTypes = useMemo(() => {
    if (!vizionare) return new Set<DocType>()
    return new Set(currentDocs.map((d) => d.docType))
  }, [currentDocs, vizionare])

  // Handle file upload
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, docType: DocType) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (!vizionare) {
        toast.error('Selecteaza o vizionare pentru a incarca documente')
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error('Fisier prea mare (max 5MB)')
        e.target.value = ''
        return
      }

      setUploadingType(docType)
      setUploadProgress(0)

      const reader = new FileReader()

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 20 + 5
        })
      }, 100)

      reader.onload = () => {
        clearInterval(progressInterval)
        setUploadProgress(100)

        const base64data = reader.result as string

        const newDoc: UploadedDocument = {
          id: generateId(),
          vizionareId: vizionare.id,
          fileName: file.name,
          fileType: file.type,
          fileData: base64data,
          filePreview: base64data,
          docType,
          uploadedAt: new Date().toISOString(),
        }

        // Replace existing doc of same type for this vizionare
        const filtered = documents.filter(
          (d) => !(d.vizionareId === vizionare.id && d.docType === docType),
        )

        setTimeout(() => {
          persistDocuments([...filtered, newDoc])
          setUploadingType(null)
          setUploadProgress(0)
          toast.success('Document incarcat cu succes!')
        }, 300)
      }

      reader.onerror = () => {
        clearInterval(progressInterval)
        setUploadingType(null)
        setUploadProgress(0)
        toast.error('Eroare la incarcarea fisierului')
      }

      reader.readAsDataURL(file)
      e.target.value = ''
    },
    [vizionare, documents, persistDocuments],
  )

  // View/Download document
  const handleViewDocument = (doc: UploadedDocument) => {
    const safeName = doc.fileName.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
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

  // Download document
  const handleDownloadDocument = (doc: UploadedDocument) => {
    const link = document.createElement('a')
    link.href = doc.filePreview
    link.download = doc.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Delete document
  const handleDeleteDocument = (docId: string) => {
    persistDocuments(documents.filter((d) => d.id !== docId))
    toast.success('Document sters')
  }

  // Download contract template
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

  // Sign & upload contract
  const handleSignContract = () => {
    setContractSigning(true)
    // Trigger file input for rental_contract type
    setTimeout(() => {
      fileInputRefs.current.rental_contract?.click()
      setContractSigning(false)
    }, 100)
  }

  // Select a vizionare from the grouped list
  const handleSelectVizionare = (vizId: string) => {
    saveToLS(LS_SELECTED_VIZIONARE, vizId)
    const found = allVizionari.find((v) => v.id === vizId) ?? null
    setVizionare(found)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Back to all documents
  const handleBackToAll = () => {
    saveToLS(LS_SELECTED_VIZIONARE, null)
    setVizionare(null)
  }

  if (!mounted) return null

  return (
    <>
      {/* Page Hero */}
      <section className="relative py-16 lg:py-20 bg-gradient-to-b from-primary/5 via-transparent to-transparent overflow-hidden">
        <div className="absolute inset-0 dots-pattern opacity-30" />
        <div
          className="floating-blob w-[400px] h-[400px] -top-32 -right-32"
          style={{ background: 'radial-gradient(circle, oklch(0.527 0.14 160 / 10%) 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <Home className="h-4 w-4" />
              <span>Acasa</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">Documente</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Documente</h1>
                <p className="text-muted-foreground mt-1">
                  Incarca si gestioneaza documentele necesare pentru vizionari si contracte
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Main Content */}
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
                className="mb-8"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Incarca Documente</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DOC_TYPE_CONFIG.map((config) => {
                    const isUploaded = uploadedTypes.has(config.type)
                    const isUploading = uploadingType === config.type
                    const Icon = config.icon

                    return (
                      <div key={config.type}>
                        <input
                          ref={(el) => { fileInputRefs.current[config.type] = el }}
                          type="file"
                          accept="image/*,.pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, config.type)}
                          aria-label={`Incarca ${DOC_TYPE_LABELS[config.type]}`}
                        />
                        <button
                          onClick={() => fileInputRefs.current[config.type]?.click()}
                          disabled={isUploading}
                          className={cn(
                            'w-full rounded-xl border-2 border-dashed p-4 text-left transition-all duration-200 relative overflow-hidden',
                            config.bgColor,
                            isUploaded
                              ? 'border-solid cursor-default'
                              : 'hover:shadow-md hover:scale-[1.01] cursor-pointer active:scale-[0.99]',
                            isUploading && 'pointer-events-none opacity-80',
                          )}
                        >
                          {/* Upload progress overlay */}
                          <AnimatePresence>
                            {isUploading && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10"
                              >
                                <div className="flex flex-col items-center gap-2 w-3/4">
                                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                  <Progress value={uploadProgress} className="h-1.5" />
                                  <span className="text-xs text-muted-foreground">Se incarca...</span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                              isUploaded ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-background/80',
                            )}>
                              {isUploaded ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Icon className={cn('h-5 w-5', config.color)} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{DOC_TYPE_LABELS[config.type]}</p>
                              <p className="text-xs text-muted-foreground truncate">{config.description}</p>
                              {isUploaded && (
                                <Badge variant="outline" className="mt-1 text-[10px] border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950/30">
                                  Incarcat
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>

                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" />
                  Dimensiune maxima: 5MB per fisier. Formate acceptate: imagine, PDF, DOC.
                </p>
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
                      {/* Contract preview */}
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
                            {currentDocs.map((doc) => {
                              const config = DOC_TYPE_CONFIG.find((c) => c.type === doc.docType)
                              const Icon = config?.icon ?? File
                              const fileSize = base64ToBytes(doc.fileData)

                              return (
                                <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className={cn(
                                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                                        config?.bgColor ?? 'bg-muted',
                                      )}>
                                        <Icon className={cn('h-4 w-4', config?.color ?? 'text-muted-foreground')} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium truncate max-w-[200px]">{doc.fileName}</p>
                                        <p className="text-[10px] text-muted-foreground">{doc.fileType}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className="text-[11px]">
                                      {DOC_TYPE_LABELS[doc.docType]}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-muted-foreground">{formatFileSize(fileSize)}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-sm text-muted-foreground">
                                      {formatUploadDate(doc.uploadedAt)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewDocument(doc)}
                                        className="h-8 w-8 p-0"
                                        aria-label="Vezi document"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownloadDocument(doc)}
                                        className="h-8 w-8 p-0"
                                        aria-label="Descarca document"
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteDocument(doc.id)}
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                        aria-label="Sterge document"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards */}
                      <div className="sm:hidden divide-y">
                        {currentDocs.map((doc) => {
                          const config = DOC_TYPE_CONFIG.find((c) => c.type === doc.docType)
                          const Icon = config?.icon ?? File
                          const fileSize = base64ToBytes(doc.fileData)

                          return (
                            <div key={doc.id} className="flex items-center justify-between p-4 gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={cn(
                                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                                  config?.bgColor ?? 'bg-muted',
                                )}>
                                  <Icon className={cn('h-5 w-5', config?.color ?? 'text-muted-foreground')} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{doc.fileName}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                      {DOC_TYPE_LABELS[doc.docType]}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">{formatFileSize(fileSize)}</span>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {formatUploadDate(doc.uploadedAt)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)} className="h-8 w-8 p-0" aria-label="Vezi">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc)} className="h-8 w-8 p-0" aria-label="Descarca">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" aria-label="Sterge">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
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