import Link from 'next/link'
import { getQuoteStatusLabel } from '../constants'
import { getTranslator } from '@/lib/i18n/server'
import type { QuoteWithDetails } from '../types'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

interface QuotesTableProps {
  quotes: QuoteWithDetails[]
}

export async function QuotesTable({ quotes }: QuotesTableProps) {
  const { t, locale } = await getTranslator()

  if (quotes.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E9EF] bg-white p-8 text-center text-slate">
        {t('quotes.table.empty')}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#E5E9EF] bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E9EF] text-left text-slate">
            <th className="px-4 py-3 font-medium">{t('quotes.table.client')}</th>
            <th className="px-4 py-3 font-medium">{t('quotes.table.project')}</th>
            <th className="px-4 py-3 font-medium">{t('quotes.table.commercial')}</th>
            <th className="px-4 py-3 font-medium">{t('quotes.table.total')}</th>
            <th className="px-4 py-3 font-medium">{t('quotes.table.estimatedDelivery')}</th>
            <th className="px-4 py-3 font-medium">{t('quotes.table.status')}</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => {
            const status = getQuoteStatusLabel(locale, quote.status)
            return (
              <tr key={quote.id} className="border-b border-[#E5E9EF] hover:bg-tint-blue/50">
                <td className="px-4 py-3 font-medium text-navy">
                  <Link href={`/quotes/${quote.id}`} className="hover:text-brand-blue hover:underline">
                    {quote.client?.name ?? '—'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate">{quote.project_type}</td>
                <td className="px-4 py-3 text-slate">{quote.commercial?.full_name || quote.commercial?.email || '—'}</td>
                <td className="px-4 py-3 text-navy">
                  {quote.current_version ? currency(quote.current_version.total) : '—'}
                </td>
                <td className="px-4 py-3 text-navy">
                  {quote.current_version?.estimated_delivery_date ?? t('quotes.table.noDate')}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
