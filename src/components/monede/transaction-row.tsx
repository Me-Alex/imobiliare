'use client'

import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ro } from 'date-fns/locale'
import { CircleDollarSign, ShoppingBag } from 'lucide-react'
import type { CoinTransaction } from '@/lib/types'

function formatTimestamp(isoString: string): string {
  return formatDistanceToNow(new Date(isoString), { addSuffix: true, locale: ro })
}

interface TransactionRowProps {
  transaction: CoinTransaction
  variant?: 'default' | 'bordered'
}

export function TransactionRow({ transaction, variant = 'default' }: TransactionRowProps) {
  const isEarned = transaction.amount > 0
  const bordered = variant === 'bordered'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex items-center gap-3 ${
        bordered
          ? 'rounded-lg border bg-card px-4 py-3'
          : 'px-5 py-3.5'
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isEarned
            ? 'bg-emerald-100 dark:bg-emerald-900/30'
            : 'bg-red-100 dark:bg-red-900/30'
        }`}
      >
        {isEarned ? (
          <CircleDollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <ShoppingBag className="h-4 w-4 text-red-600 dark:text-red-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${bordered ? 'line-clamp-1' : 'truncate'}`}>
          {transaction.description}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatTimestamp(transaction.timestamp)}
        </p>
      </div>

      <span
        className={`text-sm font-bold shrink-0 tabular-nums ${
          isEarned
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400'
        }`}
      >
        {isEarned ? '+' : ''}
        {transaction.amount}
      </span>
    </motion.div>
  )
}
