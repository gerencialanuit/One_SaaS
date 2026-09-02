'use client'

import { useMemo, useState } from 'react'
import { QuotesTable } from './QuotesTable'
import { getQuoteStatusLabel } from '../constants'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { QuoteWithDetails } from '../types'

const QUOTE_STATUSES = ['draft', 'sent', 'pending_approval', 'approved', 'rejected', 'expired'] as const

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

interface QuotesPageClientProps {
  quotes: QuoteWithDetails[]
}

export function QuotesPageClient({ quotes }: QuotesPageClientProps) {
  const { t, locale } = useLocale()
  const [search, setSearch] = useState('')

  const statusTotals = useMemo(() => {
    const map = new Map(QUOTE_STATUSES.map((status) => [status, { count: 0, total: 0 }]))
    for (const quote of quotes) {
      const entry = map.get(quote.status) ?? { count: 0, total: 0 }
      entry.count += 1
      entry.total += quote.current_version?.total ?? 0
      map.set(quote.status, entry)
    }
    return map
  }, [quotes])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return quotes
    return quotes.filter((quote) => {
      const commercial = quote.commercial?.full_name || quote.commercial?.email || ''
      return (
        (quote.client?.name ?? '').toLowerCase().includes(term) ||
        quote.project_type.toLowerCase().includes(term) ||
        commercial.toLowerCase().includes(term)
      )
    })
  }, [quotes, search])

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {QUOTE_STATUSES.map((status) => {
          const label = getQuoteStatusLabel(locale, status)
          const entry = statusTotals.get(status)!
          return (
            <div key={status} className="flex flex-col rounded-lg border border-[#E5E9EF] bg-white p-4 shadow-sm">
              <div className="flex min-h-[2.25rem] items-start">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${label.className}`}>
                  {label.label}
                </span>
              </div>
              <p className="mt-2 font-heading text-2xl font-bold text-navy">{currency(entry.total)}</p>
              <p className="text-xs text-slate-muted">
                {entry.count} {t('quotes.dashboard.quotesLabel')}
              </p>
            </div>
          )
        })}
      </div>

      <input
        type="text"
        placeholder={t('quotes.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mt-6 w-full rounded-md border border-[#E5E9EF] bg-white px-4 py-2.5 text-navy placeholder-slate-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
      />

      <div className="mt-4">
        <QuotesTable quotes={filtered} />
      </div>
    </div>
  )
}
