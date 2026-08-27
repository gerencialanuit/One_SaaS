import Link from 'next/link'
import { getTranslator } from '@/lib/i18n/server'
import type { TopClient } from '../types'

const currency = (value: number) => `$${Math.round(value).toLocaleString('es-CO')}`

export async function TopClientsList({ clients }: { clients: TopClient[] }) {
  const { t } = await getTranslator()
  return (
    <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-navy">{t('dashboard.topClients.title')}</h2>

      {clients.length === 0 ? (
        <p className="mt-4 text-sm text-slate">{t('dashboard.topClients.empty')}</p>
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
                  {client.quoteCount} {client.quoteCount === 1 ? t('dashboard.topClients.approvedQuote') : t('dashboard.topClients.approvedQuotes')}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <Link href="/clients" className="mt-4 inline-block text-sm font-medium text-brand-blue hover:text-brand-blue-hover">
        {t('dashboard.topClients.viewAll')}
      </Link>
    </div>
  )
}
