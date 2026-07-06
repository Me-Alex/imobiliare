'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarDays, Clock, User, FileText,
  Upload, XCircle, ArrowLeft, CalendarCheck, CalendarX2,
  Download, Eye, File, Trash2, Inbox,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/use-app-store'
import {
  loadFromLS, saveToLS, DEFAULT_STAFF,
  type Vizionare, type UploadedDocument, type AvailabilitySlot,
  DOC_TYPE_LABELS,
} from '@/lib/types'
import { toast } from 'sonner'

// ─── Helpers ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun',
  'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const STATUS_CONFIG: Record<Vizionare['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  pending: { label: 'In asteptare', variant: 'outline', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700' },
  confirmed: { label: 'Confirmata', variant: 'default', className: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700' },
  completed: { label: 'Finalizata', variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700' },
  cancelled: { label: 'Anulata', variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700' },
}

function formatDateRO(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

function getStaffById(id: string) {
  return DEFAULT_STAFF.find(s => s.id === id)
}

function getDocFileIcon(fileType: string) {
  if (fileType.includes('pdf')) return FileText
  if (fileType.includes('image')) return Eye
  return File
}

// ─── Document Badge ─────────────────────────────────────────────────────────

function DocTypeBadge({ docType }: { docType: UploadedDocument['docType'] }) {
  return (
    <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 font-medium">
      {DOC_TYPE_LABELS[docType]}
    </Badge>
  )
}

// ─── Document List ──────────────────────────────────────────────────────────

function DocumentList({ vizionareId }: { vizionareId: string }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const documents = useMemo(() => {
    const allDocs = loadFromLS<UploadedDocument[]>('hqs_documents', [])
    return allDocs.filter(d => d.vizionareId === vizionareId)
  }, [vizionareId, refreshKey])

  if (documents.length === 0) return null

  const handleDownload = (doc: UploadedDocument) => {
    const link = document.createElement('a')
    link.href = doc.filePreview || `data:application/octet-stream;base64,${doc.fileData}`
    link.download = doc.fileName
    link.click()
  }

  const handlePreview = (doc: UploadedDocument) => {
    if (doc.fileType.includes('image')) {
      const w = window.open('')
      if (w) {
        w.document.write(`
          <html><head><title>${doc.fileName}</title><style>body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#111;}</style></head>
          <body><img src="${doc.filePreview}" style="max-width:100%;max-height:100vh;" /></body></html>
        `)
      }
    } else {
      handleDownload(doc)
    }
  }

  const handleDelete = (docId: string) => {
    const allDocs = loadFromLS<UploadedDocument[]>('hqs_documents', [])
    saveToLS('hqs_documents', allDocs.filter(d => d.id !== docId))
    setRefreshKey(k => k + 1)
    toast.success('Document sters')
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <FileText className="h-3 w-3" />
        Documente ({documents.length})
      </p>
      <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
        {documents.map((doc) => {
          const Icon = getDocFileIcon(doc.fileType)
          return (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group"
            >
              <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs truncate flex-1">{doc.fileName}</span>
              <DocTypeBadge docType={doc.docType} />
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {doc.fileType.includes('image') && (
                  <button
                    type="button"
                    onClick={() => handlePreview(doc)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Previzualizeaza"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title="Descarca"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors"
                  title="Sterge"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Vizionare Card ─────────────────────────────────────────────────────────

function VizionareCard({
  vizionare,
  onCancel,
}: {
  vizionare: Vizionare
  onCancel: (id: string) => void
}) {
  const { navigateTo } = useAppStore()
  const staff = getStaffById(vizionare.staffId)
  const statusCfg = STATUS_CONFIG[vizionare.status]
  const isPast = vizionare.status === 'completed' || vizionare.status === 'cancelled'

  const handleUploadDocs = () => {
    saveToLS('hqs_selected_vizionare_id', vizionare.id)
    navigateTo('documente')
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`glass-card border-0 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md ${
        isPast ? 'opacity-75' : ''
      }`}>
        <CardContent className="p-4 sm:p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 min-w-0">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {staff?.avatarInitials || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate">{vizionare.propertyTitle}</h4>
                <p className="text-xs text-muted-foreground">{vizionare.staffName}</p>
              </div>
            </div>
            <Badge className={statusCfg.className} variant={statusCfg.variant}>
              {statusCfg.label}
            </Badge>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{formatDateRO(vizionare.date)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{vizionare.startTime} — {vizionare.endTime}</span>
            </div>
          </div>

          {/* Notes */}
          {vizionare.notes && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2 bg-muted/50 rounded-lg p-2.5">
              {vizionare.notes}
            </p>
          )}

          {/* Documents */}
          <DocumentList vizionareId={vizionare.id} />

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={handleUploadDocs}
            >
              <Upload className="h-3.5 w-3.5" />
              Incarca Documente
            </Button>

            {vizionare.status === 'pending' && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto"
                onClick={() => onCancel(vizionare.id)}
              >
                <XCircle className="h-3.5 w-3.5" />
                Anuleaza
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ message, icon: Icon }: { message: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <p className="text-muted-foreground text-sm max-w-xs">{message}</p>
    </motion.div>
  )
}

// ─── Timeline Dot ───────────────────────────────────────────────────────────

function TimelineDot({ status }: { status: Vizionare['status'] }) {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-400',
    confirmed: 'bg-emerald-500',
    completed: 'bg-blue-500',
    cancelled: 'bg-red-400',
  }
  return <div className={`w-3 h-3 rounded-full ${colorMap[status] || 'bg-muted'} ring-4 ring-background flex-shrink-0`} />
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function VizionarileMelePage() {
  const { user, loading: authLoading } = useAuth()
  const { navigateTo } = useAppStore()
  const [refreshKey, setRefreshKey] = useState(0)
  const [activeTab, setActiveTab] = useState('active')

  const vizionari = useMemo(() => {
    if (!user) return []
    const all = loadFromLS<Vizionare[]>('hqs_vizionari', [])
    return all.filter(v => v.userId === user.id)
  }, [user, refreshKey])

  const activeVizionari = useMemo(
    () => vizionari.filter(v => v.status === 'pending' || v.status === 'confirmed')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [vizionari]
  )

  const historyVizionari = useMemo(
    () => vizionari.filter(v => v.status === 'completed' || v.status === 'cancelled')
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime)),
    [vizionari]
  )

  const handleCancel = useCallback((id: string) => {
    const all = loadFromLS<Vizionare[]>('hqs_vizionari', [])
    const idx = all.findIndex(v => v.id === id)
    if (idx !== -1) {
      all[idx].status = 'cancelled'
      saveToLS('hqs_vizionari', all)
      // Also free the availability slot
      const slots = loadFromLS<AvailabilitySlot[]>('hqs_staff_availability', [])
      const slotIdx = slots.findIndex(
        (s: AvailabilitySlot) =>
          s.staffId === all[idx].staffId &&
          s.date === all[idx].date &&
          s.startTime === all[idx].startTime &&
          s.isBooked
      )
      if (slotIdx !== -1) {
        slots[slotIdx].isBooked = false
        slots[slotIdx].bookedBy = null
        slots[slotIdx].bookedByName = null
        saveToLS('hqs_staff_availability', slots)
      }
      setRefreshKey(k => k + 1)
      toast.success('Vizionare anulata', { description: 'Programarea a fost anulata cu succes.' })
    }
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 text-center max-w-md"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
            <User className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">Autentifica-te</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Trebuie sa fii autentificat pentru a vedea vizionarile tale.
          </p>
          <Button onClick={() => navigateTo('login')} className="gap-2">
            Autentifica-te
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigateTo('acasa')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Inapoi
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Vizionarile Mele
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestioneaza programarile tale de vizionare.
          </p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Active', count: activeVizionari.length, icon: CalendarCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'In asteptare', count: activeVizionari.filter(v => v.status === 'pending').length, icon: Clock, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
            { label: 'Confirmate', count: activeVizionari.filter(v => v.status === 'confirmed').length, icon: CalendarDays, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Istoric', count: historyVizionari.length, icon: CalendarX2, color: 'text-muted-600 bg-muted/50' },
          ].map(stat => (
            <div key={stat.label} className="glass-card rounded-xl p-3 sm:p-4 text-center">
              <div className={`mx-auto w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-bold">{stat.count}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="active" className="flex-1 gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 hidden sm:block" />
              Vizionari Active
              {activeVizionari.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-[10px] px-1.5">
                  {activeVizionari.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 gap-1.5">
              <CalendarX2 className="h-3.5 w-3.5 hidden sm:block" />
              Istoric
              {historyVizionari.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-[10px] px-1.5">
                  {historyVizionari.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Active Tab */}
          <TabsContent value="active">
            <AnimatePresence mode="popLayout">
              {activeVizionari.length > 0 ? (
                <div className="space-y-3">
                  {activeVizionari.map((v) => (
                    <VizionareCard key={v.id} vizionare={v} onCancel={handleCancel} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarCheck}
                  message="Fara vizionari programate. Programeaza o vizionare la o proprietate care te intereseaza."
                />
              )}
            </AnimatePresence>

            {activeVizionari.length > 0 && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigateTo('programare-vizionare')}
                >
                  <CalendarDays className="h-4 w-4" />
                  Programeaza o Vizionare Noua
                </Button>
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <AnimatePresence mode="popLayout">
              {historyVizionari.length > 0 ? (
                <div className="relative pl-6">
                  {/* Timeline line */}
                  <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-border" />

                  <div className="space-y-4">
                    {historyVizionari.map((v) => (
                      <div key={v.id} className="relative">
                        <TimelineDot status={v.status} />
                        <VizionareCard vizionare={v} onCancel={handleCancel} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Inbox}
                  message="Nu ai inca vizionari in istoric. Vizionarile finalizate sau anulate vor aparea aici."
                />
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}