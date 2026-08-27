'use client'

import { useState } from 'react'
import { receivePurchaseOrder, cancelPurchaseOrder } from '@/actions/purchase-orders'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { TranslationKey } from '@/lib/i18n/translations'
import type { PurchaseOrderWithDetails } from '../types'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

const STATUS_CLASSNAMES: Record<string, string> = {
  pending: 'bg-brand-yellow/20 text-[#8A6D00]',
  partial: 'bg-brand-yellow/20 text-[#8A6D00]',
  received: 'bg-[#038A06]/10 text-[#038A06]',
  cancelled: 'bg-red-50 text-red-600',
}

const STATUS_KEYS: Record<string, TranslationKey> = {
  pending: 'purchaseOrders.status.pending',
  partial: 'purchaseOrders.status.partial',
  received: 'purchaseOrders.status.received',
  cancelled: 'purchaseOrders.status.cancelled',
}

interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrderWithDetails[]
  canManage: boolean
}

export function PurchaseOrdersTable({ purchaseOrders, canManage }: PurchaseOrdersTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { t } = useLocale()

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
        {t('purchaseOrders.table.empty')}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#E5E9EF] bg-white shadow-sm">
      {error && <p className="border-b border-[#E5E9EF] px-4 py-2 text-sm text-red-600">{error}</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E9EF] text-left text-slate">
            <th className="px-4 py-3 font-medium">{t('purchaseOrders.table.supplier')}</th>
            <th className="px-4 py-3 font-medium">{t('purchaseOrders.table.products')}</th>
            <th className="px-4 py-3 font-medium">{t('purchaseOrders.table.totalValue')}</th>
            <th className="px-4 py-3 font-medium">{t('purchaseOrders.table.expectedArrival')}</th>
            <th className="px-4 py-3 font-medium">{t('purchaseOrders.table.status')}</th>
            {canManage && <th className="px-4 py-3 font-medium">{t('purchaseOrders.table.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {purchaseOrders.map((po) => {
            const statusKey = STATUS_KEYS[po.status] ?? STATUS_KEYS.pending
            const statusClassName = STATUS_CLASSNAMES[po.status] ?? STATUS_CLASSNAMES.pending
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
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClassName}`}>
                    {t(statusKey)}
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
                          {t('purchaseOrders.table.receive')}
                        </button>
                        <button
                          type="button"
                          disabled={busyId === po.id}
                          onClick={() => handleCancel(po.id)}
                          className="font-medium text-slate hover:text-navy disabled:opacity-50"
                        >
                          {t('purchaseOrders.table.cancel')}
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
