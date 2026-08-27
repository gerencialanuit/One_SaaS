import { getQuoteStatusLabel } from '@/features/quotes/constants'
import { getTranslator } from '@/lib/i18n/server'
import type { StatusBreakdownEntry } from '../utils/compute-kpis'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

export async function StatusBreakdownList({ breakdown }: { breakdown: StatusBreakdownEntry[] }) {
  const { t, locale } = await getTranslator()

  if (breakdown.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 text-center text-sm text-slate shadow-sm">
        {t('dashboard.statusBreakdown.empty')}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-navy">{t('dashboard.statusBreakdown.title')}</h2>
      <ul className="mt-3 divide-y divide-[#E5E9EF]">
        {breakdown.map((entry) => {
          const status = getQuoteStatusLabel(locale, entry.status)
          return (
            <li key={entry.status} className="flex items-center gap-3 py-2.5 text-sm">
              <div className="w-36 shrink-0">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex-1 text-center text-slate">
                {entry.count} {entry.count === 1 ? t('dashboard.statusBreakdown.quote') : t('dashboard.statusBreakdown.quotes')}
              </div>
              <div className="w-32 shrink-0 text-right font-medium text-navy">{currency(entry.total)}</div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
