'use client'

import { useState } from 'react'
import { ProductsTable } from './ProductsTable'
import { ProductFormModal } from './ProductFormModal'
import type { ProductWithAvailability, SupplierOption } from '../types'

interface ProductsPageClientProps {
  products: ProductWithAvailability[]
  suppliers: SupplierOption[]
  canManage: boolean
}

export function ProductsPageClient({ products, suppliers, canManage }: ProductsPageClientProps) {
  const [modalProduct, setModalProduct] = useState<ProductWithAvailability | null | 'new'>(null)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-navy">Productos e Inventario</h1>
          <p className="mt-1 text-slate">Catálogo y disponibilidad en tiempo real</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setModalProduct('new')}
            className="rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover"
          >
            Nuevo producto
          </button>
        )}
      </div>

      <div className="mt-6">
        <ProductsTable
          products={products}
          canManage={canManage}
          onEdit={(product) => setModalProduct(product)}
        />
      </div>

      {modalProduct && (
        <ProductFormModal
          product={modalProduct === 'new' ? null : modalProduct}
          suppliers={suppliers}
          onClose={() => setModalProduct(null)}
        />
      )}
    </div>
  )
}
