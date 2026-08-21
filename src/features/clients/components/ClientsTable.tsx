'use client'

import { CLIENT_TYPE_LABELS } from '../constants'
import type { Client } from '@/types/database'

interface ClientsTableProps {
  clients: Client[]
  onEdit: (client: Client) => void
}

export function ClientsTable({ clients, onEdit }: ClientsTableProps) {
  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E9EF] bg-white p-8 text-center text-slate">
        No hay clientes todavía.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#E5E9EF] bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E9EF] text-left text-slate">
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">WhatsApp</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Dirección</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-b border-[#E5E9EF] hover:bg-tint-blue/50">
              <td className="px-4 py-3 font-medium text-navy">{client.name}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-tint-blue px-2.5 py-0.5 text-xs font-medium text-navy">
                  {CLIENT_TYPE_LABELS[client.client_type]}
                </span>
              </td>
              <td className="px-4 py-3 text-slate">{client.whatsapp ?? '—'}</td>
              <td className="px-4 py-3 text-slate">{client.email ?? '—'}</td>
              <td className="px-4 py-3 text-slate">{client.address ?? '—'}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onEdit(client)}
                  className="font-medium text-brand-blue hover:text-brand-blue-hover"
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
