import Link from 'next/link'
import { QUOTE_STATUS_LABELS } from '../constants'
import type { QuoteWithDetails } from '../types'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

interface QuotesTableProps {
  quotes: QuoteWithDetails[]
}

export function QuotesTable({ quotes }: QuotesTableProps) {
  if (quotes.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E9EF] bg-white p-8 text-center text-slate">
        No hay cotizaciones todavía.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#E5E9EF] bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E9EF] text-left text-slate">
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Proyecto</th>
            <th className="px-4 py-3 font-medium">Comercial</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Entrega estimada</th>
            <th className="px-4 py-3 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => {
            const status = QUOTE_STATUS_LABELS[quote.status] ?? QUOTE_STATUS_LABELS.draft
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
                  {quote.current_version?.estimated_delivery_date ?? 'Sin fecha'}
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
