import Link from 'next/link'
import type { QuoteSummary } from '../types'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

export function PendingApprovalsList({ quotes }: { quotes: QuoteSummary[] }) {
  return (
    <div className="rounded-lg border border-brand-yellow/40 bg-tint-yellow p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-navy">Aprobaciones de descuento pendientes</h2>
      {quotes.length === 0 ? (
        <p className="mt-2 text-sm text-slate">No hay aprobaciones pendientes.</p>
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
