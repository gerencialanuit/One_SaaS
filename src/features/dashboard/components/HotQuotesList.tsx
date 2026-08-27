import Link from 'next/link'
import { getTranslator } from '@/lib/i18n/server'
import type { HotQuote } from '../types'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

function daysSince(dateStr: string): number {
  const days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  return Math.floor(days)
}

export async function HotQuotesList({ quotes }: { quotes: HotQuote[] }) {
  const { t } = await getTranslator()
  return (
    <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-navy">{t('dashboard.hotQuotes.title')}</h2>
      <p className="mt-1 text-xs text-slate-muted">{t('dashboard.hotQuotes.subtitle')}</p>
      {quotes.length === 0 ? (
        <p className="mt-2 text-sm text-slate">{t('dashboard.hotQuotes.empty')}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {quotes.map((quote) => (
            <li key={quote.quoteId}>
              <Link
                href={`/quotes/${quote.quoteId}`}
                className="flex items-center justify-between rounded-md border border-[#E5E9EF] px-4 py-3 text-sm transition-colors hover:bg-tint-blue"
              >
                <div>
                  <div className="font-medium text-navy">{quote.clientName}</div>
                  <div className="text-slate">{t('dashboard.hotQuotes.viewedAgo', { n: daysSince(quote.viewedAt) })}</div>
                </div>
                <span className="font-semibold text-navy">{currency(quote.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
