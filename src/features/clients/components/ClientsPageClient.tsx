'use client'

import { useState } from 'react'
import { ClientsTable } from './ClientsTable'
import { ClientFormModal } from './ClientFormModal'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { Client } from '@/types/database'

interface ClientsPageClientProps {
  clients: Client[]
  canCreate: boolean
}

export function ClientsPageClient({ clients, canCreate }: ClientsPageClientProps) {
  const [modalClient, setModalClient] = useState<Client | null | 'new'>(null)
  const { t } = useLocale()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-navy">{t('clients.title')}</h1>
          <p className="mt-1 text-slate">{t('clients.subtitle')}</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setModalClient('new')}
            className="rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover"
          >
            {t('clients.new')}
          </button>
        )}
      </div>

      <div className="mt-6">
        <ClientsTable clients={clients} onEdit={(client) => setModalClient(client)} />
      </div>

      {modalClient && (
        <ClientFormModal
          client={modalClient === 'new' ? null : modalClient}
          onClose={() => setModalClient(null)}
        />
      )}
    </div>
  )
}
