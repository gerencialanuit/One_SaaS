import Link from 'next/link'
import { getTranslator } from '@/lib/i18n/server'
import { t, type Locale } from '@/lib/i18n/translations'
import type { UpcomingArrival } from '../types'

function ArrivalCountdown({ days, locale }: { days: number; locale: Locale }) {
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
        {t(locale, 'dashboard.upcomingArrivals.overdue', { n: Math.abs(days) })}
      </span>
    )
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-brand-yellow/20 px-2 py-0.5 text-xs font-semibold text-[#8A6D00]">
        {t(locale, 'dashboard.upcomingArrivals.dueToday')}
      </span>
    )
  }
  return (
    <span className="text-xs text-slate-muted">
      {t(locale, 'dashboard.upcomingArrivals.daysLeft', { n: days })}
    </span>
  )
}

export async function UpcomingArrivalsList({ arrivals }: { arrivals: UpcomingArrival[] }) {
  const { t: tr, locale } = await getTranslator()
  return (
    <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-navy">{tr('dashboard.upcomingArrivals.title')}</h2>
      {arrivals.length === 0 ? (
        <p className="mt-2 text-sm text-slate">{tr('dashboard.upcomingArrivals.empty')}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {arrivals.map((arrival) => (
            <li
              key={arrival.id}
              className={`rounded-md border px-4 py-3 text-sm ${arrival.daysUntilArrival < 0 ? 'border-red-200 bg-red-50/40' : 'border-[#E5E9EF]'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-navy">{arrival.supplierName}</span>
                <span className="text-slate">{arrival.expectedArrivalDate}</span>
              </div>
              <div className="mt-1">
                <ArrivalCountdown days={arrival.daysUntilArrival} locale={locale} />
              </div>
              <div className="mt-1 text-slate-muted">{arrival.itemsSummary}</div>
            </li>
          ))}
        </ul>
      )}
      <Link href="/purchase-orders" className="mt-3 inline-block text-sm font-medium text-brand-blue hover:text-brand-blue-hover">
        {tr('dashboard.upcomingArrivals.viewAll')}
      </Link>
    </div>
  )
}
