import Link from 'next/link'
import type { TopClient } from '../types'

const currency = (value: number) => `$${Math.round(value).toLocaleString('es-CO')}`

export function TopClientsList({ clients }: { clients: TopClient[] }) {
  return (
    <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-navy">Mejores clientes (cotizaciones aprobadas)</h2>

      {clients.length === 0 ? (
        <p className="mt-4 text-sm text-slate">Sin cotizaciones aprobadas todavía.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {clients.map((client, index) => {
            const maxValue = clients[0].totalValue || 1
            const barWidth = Math.max((client.totalValue / maxValue) * 100, 4)
            return (
              <div key={client.clientId}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium text-navy">
                    <span className="text-xs text-slate-muted">#{index + 1}</span>
                    {client.clientName}
                  </span>
                  <span className="text-navy">{currency(client.totalValue)}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-tint-blue">
                  <div className="h-full rounded-full bg-brand-blue" style={{ width: `${barWidth}%` }} />
                </div>
                <p className="mt-0.5 text-xs text-slate-muted">
                  {client.quoteCount} cotización{client.quoteCount === 1 ? '' : 'es'} aprobada{client.quoteCount === 1 ? '' : 's'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <Link href="/clients" className="mt-4 inline-block text-sm font-medium text-brand-blue hover:text-brand-blue-hover">
        Ver todos los clientes
      </Link>
    </div>
  )
}
