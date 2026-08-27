import Link from 'next/link'
import { getTranslator } from '@/lib/i18n/server'
import type { QuoteSummary } from '../types'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

export async function PendingApprovalsList({ quotes }: { quotes: QuoteSummary[] }) {
  const { t } = await getTranslator()
  return (
    <div className="rounded-lg border border-brand-yellow/40 bg-tint-yellow p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-navy">{t('dashboard.pendingApprovals.title')}</h2>
      {quotes.length === 0 ? (
        <p className="mt-2 text-sm text-slate">{t('dashboard.pendingApprovals.empty')}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {quotes.map((quote) => (
            <li key={quote.id}>
              <Link
                href={`/quotes/${quote.id}`}
                className="flex items-center justify-between rounded-md bg-white px-4 py-3 text-sm shadow-sm transition-colors hover:bg-tint-blue"
              >
                <div>
                  <div className="font-medium text-navy">{quote.clientName}</div>
                  <div className="text-slate">{quote.projectType}</div>
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
