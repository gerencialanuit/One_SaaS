'use client'

import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import type { ProductOpenPoSummary } from '../types'

interface PurchaseOrderDetailModalProps {
  productName: string
  summary: ProductOpenPoSummary
  onClose: () => void
}

export function PurchaseOrderDetailModal({ productName, summary, onClose }: PurchaseOrderDetailModalProps) {
  useEscapeClose(onClose)

  const sortedLines = [...summary.lines].sort((a, b) => a.expectedArrivalDate.localeCompare(b.expectedArrivalDate))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-xl font-semibold text-navy">Órdenes de compra pendientes</h2>
        <p className="mt-1 text-sm text-slate">{productName}</p>

        <div className="mt-4 space-y-2">
          {sortedLines.map((line) => (
            <div key={line.purchaseOrderId} className="flex items-center justify-between rounded-md border border-[#E5E9EF] px-4 py-3 text-sm">
              <div>
                <div className="font-medium text-navy">{line.supplierName}</div>
                <div className="text-xs text-slate-muted">Llega: {line.expectedArrivalDate}</div>
              </div>
              <div className="font-heading font-semibold text-navy">×{line.quantity}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between border-t border-[#E5E9EF] pt-3 text-sm font-semibold">
          <span className="text-navy">Total en camino</span>
          <span className="text-navy">{summary.totalQuantity}</span>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="px-3 py-2 font-medium text-slate hover:text-navy">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
