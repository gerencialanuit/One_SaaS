'use client'

import { toggleProductActive } from '@/actions/products'
import { InventoryQuantityCell } from './InventoryQuantityCell'
import type { ProductWithAvailability } from '../types'

const CONDITION_LABELS: Record<string, { label: string; className: string }> = {
  nuevo: { label: 'Nuevo', className: 'bg-[#038A06]/10 text-[#038A06]' },
  usado: { label: 'Usado', className: 'bg-brand-yellow/20 text-[#8A6D00]' },
  averiado: { label: 'Averiado', className: 'bg-red-50 text-red-600' },
}

interface ProductsTableProps {
  products: ProductWithAvailability[]
  canManage: boolean
  onEdit: (product: ProductWithAvailability) => void
}

export function ProductsTable({ products, canManage, onEdit }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E9EF] bg-white p-8 text-center text-slate">
        No hay productos todavía.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#E5E9EF] bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E9EF] text-left text-slate">
            <th className="px-4 py-3 font-medium">Producto</th>
            <th className="px-4 py-3 font-medium">Marca</th>
            <th className="px-4 py-3 font-medium">Categoría</th>
            <th className="px-4 py-3 font-medium">Precio</th>
            <th className="px-4 py-3 font-medium">Costo</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Físico</th>
            <th className="px-4 py-3 font-medium">Comprometido</th>
            <th className="px-4 py-3 font-medium">Disponibilidad con Cotizaciones</th>
            {canManage && <th className="px-4 py-3 font-medium">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const availability = product.availability
            const available = availability?.available_with_quotes ?? 0
            const isLowStock = available <= product.low_stock_threshold

            return (
              <tr key={product.id} className="border-b border-[#E5E9EF] hover:bg-tint-blue/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#E5E9EF] bg-tint-blue">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-slate-muted">Sin foto</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-navy">{product.name}</div>
                      {product.sku && <div className="text-xs text-slate-muted">{product.sku}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate">{product.brand || '—'}</td>
                <td className="px-4 py-3 text-slate">{product.category}</td>
                <td className="px-4 py-3 text-navy">
                  ${product.unit_price.toLocaleString('es-CO')}
                </td>
                <td className="px-4 py-3 text-slate">
                  {product.unit_cost != null ? `${product.currency} $${product.unit_cost.toLocaleString('es-CO')}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CONDITION_LABELS[product.condition]?.className ?? ''}`}>
                    {CONDITION_LABELS[product.condition]?.label ?? product.condition}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <InventoryQuantityCell
                    productId={product.id}
                    quantityOnHand={availability?.quantity_on_hand ?? 0}
                    canEdit={canManage}
                  />
                </td>
                <td className="px-4 py-3 text-slate">{availability?.committed_in_quotes ?? 0}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy">{available}</span>
                    {isLowStock && (
                      <span className="inline-flex items-center rounded-full bg-brand-yellow/20 px-2.5 py-0.5 text-xs font-medium text-[#8A6D00]">
                        Stock bajo
                      </span>
                    )}
                  </div>
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="font-medium text-brand-blue hover:text-brand-blue-hover"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleProductActive(product.id, !product.is_active)}
                        className="font-medium text-slate hover:text-navy"
                      >
                        {product.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
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
