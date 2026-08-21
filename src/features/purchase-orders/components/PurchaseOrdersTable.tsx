'use client'

import { useState } from 'react'
import { receivePurchaseOrder, cancelPurchaseOrder } from '@/actions/purchase-orders'
import type { PurchaseOrderWithDetails } from '../types'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-brand-yellow/20 text-[#8A6D00]' },
  partial: { label: 'Parcial', className: 'bg-brand-yellow/20 text-[#8A6D00]' },
  received: { label: 'Recibida', className: 'bg-[#038A06]/10 text-[#038A06]' },
  cancelled: { label: 'Cancelada', className: 'bg-red-50 text-red-600' },
}

interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrderWithDetails[]
  canManage: boolean
}

export function PurchaseOrdersTable({ purchaseOrders, canManage }: PurchaseOrdersTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleReceive(id: string) {
    setBusyId(id)
    setError(null)
    const result = await receivePurchaseOrder(id)
    if (result?.error) setError(result.error)
    setBusyId(null)
  }

  async function handleCancel(id: string) {
    setBusyId(id)
    setError(null)
    const result = await cancelPurchaseOrder(id)
    if (result?.error) setError(result.error)
    setBusyId(null)
  }

  if (purchaseOrders.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E9EF] bg-white p-8 text-center text-slate">
        No hay órdenes de compra todavía.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#E5E9EF] bg-white shadow-sm">
      {error && <p className="border-b border-[#E5E9EF] px-4 py-2 text-sm text-red-600">{error}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E9EF] text-left text-slate">
            <th className="px-4 py-3 font-medium">Proveedor</th>
            <th className="px-4 py-3 font-medium">Productos</th>
            <th className="px-4 py-3 font-medium">Valor total</th>
            <th className="px-4 py-3 font-medium">Llegada estimada</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            {canManage && <th className="px-4 py-3 font-medium">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {purchaseOrders.map((po) => {
            const status = STATUS_LABELS[po.status] ?? STATUS_LABELS.pending
            const canReceive = po.status === 'pending' || po.status === 'partial'
            const totalValue = po.items.reduce((sum, item) => sum + item.quantity * (item.unit_cost ?? 0), 0)

            return (
              <tr key={po.id} className="border-b border-[#E5E9EF] hover:bg-tint-blue/50">
                <td className="px-4 py-3 font-medium text-navy">{po.supplier?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate">
                  {po.items.map((item) => `${item.product?.name ?? '—'} ×${item.quantity}`).join(', ')}
                </td>
                <td className="px-4 py-3 font-medium text-navy">{currency(totalValue)}</td>
                <td className="px-4 py-3 text-navy">{po.expected_arrival_date}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    {canReceive && (
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={busyId === po.id}
                          onClick={() => handleReceive(po.id)}
                          className="font-medium text-brand-blue hover:text-brand-blue-hover disabled:opacity-50"
                        >
                          Recibir
                        </button>
                        <button
                          type="button"
                          disabled={busyId === po.id}
                          onClick={() => handleCancel(po.id)}
                          className="font-medium text-slate hover:text-navy disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
