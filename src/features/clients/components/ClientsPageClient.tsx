'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClientsTable } from './ClientsTable'
import { ClientFormModal } from './ClientFormModal'
import { deleteClient } from '@/actions/clients'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { Client } from '@/types/database'

interface ClientsPageClientProps {
  clients: Client[]
  canCreate: boolean
}

export function ClientsPageClient({ clients, canCreate }: ClientsPageClientProps) {
  const [modalClient, setModalClient] = useState<Client | null | 'new'>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { t } = useLocale()
  const router = useRouter()

  async function handleDelete(client: Client) {
    if (!window.confirm(t('clients.table.deleteConfirm', { name: client.name }))) return
    setDeleteError(null)
    setDeletingId(client.id)
    const result = await deleteClient(client.id)
    setDeletingId(null)
    if (result?.error) {
      setDeleteError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
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

      {deleteError && <p className="mt-4 text-sm text-red-600">{deleteError}</p>}

      <div className="mt-6">
        <ClientsTable
          clients={clients}
          onEdit={(client) => setModalClient(client)}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
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
