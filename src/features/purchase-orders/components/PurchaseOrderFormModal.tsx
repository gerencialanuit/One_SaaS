'use client'

import { useState } from 'react'
import { createPurchaseOrder } from '@/actions/purchase-orders'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import type { SupplierOption } from '@/features/products/types'
import type { ProductOption } from '../types'

interface ItemRow {
  product_id: string
  quantity: string
  unit_cost: string
}

interface PurchaseOrderFormModalProps {
  suppliers: SupplierOption[]
  products: ProductOption[]
  onClose: () => void
}

function emptyRow(): ItemRow {
  return { product_id: '', quantity: '1', unit_cost: '' }
}

export function PurchaseOrderFormModal({ suppliers, products, onClose }: PurchaseOrderFormModalProps) {
  const [rows, setRows] = useState<ItemRow[]>([emptyRow()])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEscapeClose(onClose)

  function updateRow(index: number, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()])
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const items = rows
      .filter((row) => row.product_id && row.quantity)
      .map((row) => ({
        product_id: row.product_id,
        quantity: row.quantity,
        unit_cost: row.unit_cost || undefined,
      }))

    formData.set('items', JSON.stringify(items))

    const result = await createPurchaseOrder(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-xl font-semibold text-navy">Nueva orden de compra</h2>

        <form action={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="supplier_id" className="block text-sm font-medium text-navy">Proveedor</label>
              <select
                id="supplier_id"
                name="supplier_id"
                required
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              >
                <option value="">Selecciona un proveedor</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="expected_arrival_date" className="block text-sm font-medium text-navy">Fecha estimada de llegada</label>
              <input
                id="expected_arrival_date"
                name="expected_arrival_date"
                type="date"
                required
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="block text-sm font-medium text-navy">Productos</span>
              <button type="button" onClick={addRow} className="text-sm font-medium text-brand-blue hover:text-brand-blue-hover">
                + Agregar producto
              </button>
            </div>

            <div className="mt-2 space-y-2">
              {rows.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={row.product_id}
                    onChange={(e) => updateRow(index, { product_id: e.target.value })}
                    className="flex-1 rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-sm text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                  >
                    <option value="">Producto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    placeholder="Cant."
                    value={row.quantity}
                    onChange={(e) => updateRow(index, { quantity: e.target.value })}
                    className="w-20 rounded-md border border-[#E5E9EF] bg-white px-2 py-2 text-sm text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Costo"
                    value={row.unit_cost}
                    onChange={(e) => updateRow(index, { unit_cost: e.target.value })}
                    className="w-24 rounded-md border border-[#E5E9EF] bg-white px-2 py-2 text-sm text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                  />
                  {rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(index)} className="px-2 text-slate hover:text-red-600">
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
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
              {loading ? 'Creando...' : 'Crear orden de compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
