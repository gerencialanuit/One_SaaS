'use client'

import { useState } from 'react'
import { ProductsTable } from './ProductsTable'
import { ProductFormModal } from './ProductFormModal'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { ProductWithAvailability, SupplierOption, ProductOpenPoSummary } from '../types'

interface ProductsPageClientProps {
  products: ProductWithAvailability[]
  suppliers: SupplierOption[]
  canManage: boolean
  openPurchaseOrders: Record<string, ProductOpenPoSummary>
}

export function ProductsPageClient({ products, suppliers, canManage, openPurchaseOrders }: ProductsPageClientProps) {
  const [modalProduct, setModalProduct] = useState<ProductWithAvailability | null | 'new'>(null)
  const { t } = useLocale()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-navy">{t('products.title')}</h1>
          <p className="mt-1 text-slate">{t('products.subtitle')}</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setModalProduct('new')}
            className="rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover"
          >
            {t('products.new')}
          </button>
        )}
      </div>

      <div className="mt-6">
        <ProductsTable
          products={products}
          canManage={canManage}
          onEdit={(product) => setModalProduct(product)}
          openPurchaseOrders={openPurchaseOrders}
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
