import { Badge } from '@/components/ui/badge'
import { getStatusLabel, getStatusTone } from '@/lib/presentation'
import { cn } from '@/lib/utils'

export function StatusBadge({
  status,
  className,
}: {
  status: unknown
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn('border text-[10px] font-medium', getStatusTone(status), className)}>
      {getStatusLabel(status)}
    </Badge>
  )
}
