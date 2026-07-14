'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Clock, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { UserProperty } from '@/lib/types'

interface MyPropertiesListProps {
  properties: UserProperty[]
  visible: boolean
  onEdit: (prop: UserProperty) => void
  onDelete: (id: string) => void
}

export function MyPropertiesList({ properties, visible, onEdit, onDelete }: MyPropertiesListProps) {
  return (
    <AnimatePresence>
      {visible && properties.length > 0 && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Proprietatile tale ({properties.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {properties.map((prop) => (
                  <div key={prop.id as string} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-12 w-12 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
                        {prop.cover_url ? (
                          <img src={prop.cover_url as string} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Building2 className="h-5 w-5 text-primary/50" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{prop.title as string}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{prop.zone as string}{prop.sector ? `, ${prop.sector}` : ''}</span>
                          <span>·</span>
                          <span className="font-semibold text-foreground">
                            {Number(prop.price).toLocaleString('ro-RO')} {prop.currency as string}
                          </span>
                          {prop.transaction === 'INCHIRIERE' && <span>/luna</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className="text-[10px]">{prop.type as string}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(prop.created_at as string).toLocaleDateString('ro-RO')}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary" onClick={() => onEdit(prop)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={() => onDelete(prop.id as string)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}