'use client'

import { useState } from 'react'
import { createClient, updateClient } from '@/actions/clients'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import { CLIENT_TYPES, getClientTypeLabel } from '../constants'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { Client } from '@/types/database'

interface ClientFormModalProps {
  client: Client | null
  onClose: () => void
  onCreated?: (client: { id: string; name: string }) => void
}

export function ClientFormModal({ client, onClose, onCreated }: ClientFormModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { locale } = useLocale()

  useEscapeClose(onClose)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    if (client) {
      const result = await updateClient(client.id, formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }
      setLoading(false)
      onClose()
      return
    }

    const result = await createClient(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    if (result.client) {
      onCreated?.(result.client)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-xl font-semibold text-navy">
          {client ? 'Editar cliente' : 'Nuevo cliente'}
        </h2>

        <form action={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-navy">Nombre</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={client?.name ?? ''}
              className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-navy">WhatsApp</label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="text"
                placeholder="+57 300 000 0000"
                defaultValue={client?.whatsapp ?? ''}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy placeholder-slate-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={client?.email ?? ''}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-navy">Dirección</label>
              <input
                id="address"
                name="address"
                type="text"
                required
                defaultValue={client?.address ?? ''}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-navy">Ciudad</label>
              <input
                id="city"
                name="city"
                type="text"
                required
                defaultValue={client?.city ?? ''}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
          </div>
          <div>
            <label htmlFor="client_type" className="block text-sm font-medium text-navy">Tipo de cliente</label>
            <select
              id="client_type"
              name="client_type"
              defaultValue={client?.client_type ?? 'cliente_final'}
              className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            >
              {CLIENT_TYPES.map((value) => (
                <option key={value} value={value}>{getClientTypeLabel(locale, value)}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 font-medium text-slate hover:text-navy">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover disabled:opacity-50"
            >
              {loading ? 'Guardando...' : client ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
