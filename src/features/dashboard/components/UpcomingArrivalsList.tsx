import Link from 'next/link'
import type { UpcomingArrival } from '../types'

function ArrivalCountdown({ days }: { days: number }) {
  if (days < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
        Vencida hace {Math.abs(days)} día{Math.abs(days) === 1 ? '' : 's'}
      </span>
    )
  }
  if (days === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-brand-yellow/20 px-2 py-0.5 text-xs font-semibold text-[#8A6D00]">
        Llega hoy
      </span>
    )
  }
  return (
    <span className="text-xs text-slate-muted">
      Faltan {days} día{days === 1 ? '' : 's'}
    </span>
  )
}

export function UpcomingArrivalsList({ arrivals }: { arrivals: UpcomingArrival[] }) {
  return (
    <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-navy">Próximas llegadas</h2>
      {arrivals.length === 0 ? (
        <p className="mt-2 text-sm text-slate">No hay órdenes de compra pendientes.</p>
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
                <ArrivalCountdown days={arrival.daysUntilArrival} />
              </div>
              <div className="mt-1 text-slate-muted">{arrival.itemsSummary}</div>
            </li>
          ))}
        </ul>
      )}
      <Link href="/purchase-orders" className="mt-3 inline-block text-sm font-medium text-brand-blue hover:text-brand-blue-hover">
        Ver todas las órdenes de compra
      </Link>
    </div>
  )
}
