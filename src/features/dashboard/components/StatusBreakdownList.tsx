import { QUOTE_STATUS_LABELS } from '@/features/quotes/constants'
import type { StatusBreakdownEntry } from '../utils/compute-kpis'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

export function StatusBreakdownList({ breakdown }: { breakdown: StatusBreakdownEntry[] }) {
  if (breakdown.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 text-center text-sm text-slate shadow-sm">
        No hay cotizaciones todavía.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-navy">Cotizaciones por estado</h2>
      <ul className="mt-3 divide-y divide-[#E5E9EF]">
        {breakdown.map((entry) => {
          const status = QUOTE_STATUS_LABELS[entry.status] ?? QUOTE_STATUS_LABELS.draft
          return (
            <li key={entry.status} className="flex items-center justify-between py-2.5 text-sm">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                {status.label}
              </span>
              <span className="text-slate">{entry.count} {entry.count === 1 ? 'cotización' : 'cotizaciones'}</span>
              <span className="font-medium text-navy">{currency(entry.total)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
