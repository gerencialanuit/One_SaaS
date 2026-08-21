'use client'

import { useState } from 'react'
import { ClientsTable } from './ClientsTable'
import { ClientFormModal } from './ClientFormModal'
import type { Client } from '@/types/database'

interface ClientsPageClientProps {
  clients: Client[]
  canCreate: boolean
}

export function ClientsPageClient({ clients, canCreate }: ClientsPageClientProps) {
  const [modalClient, setModalClient] = useState<Client | null | 'new'>(null)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-navy">Clientes</h1>
          <p className="mt-1 text-slate">Contactos usados en las cotizaciones</p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setModalClient('new')}
            className="rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover"
          >
            Nuevo cliente
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
