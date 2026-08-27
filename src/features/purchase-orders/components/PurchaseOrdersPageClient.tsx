'use client'

import { useMemo, useState } from 'react'
import { SuppliersPanel } from './SuppliersPanel'
import { PurchaseOrdersTable } from './PurchaseOrdersTable'
import { PurchaseOrderFormModal } from './PurchaseOrderFormModal'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { PurchaseOrderWithDetails, ProductOption } from '../types'
import type { Supplier } from '@/types/database'

interface PurchaseOrdersPageClientProps {
  purchaseOrders: PurchaseOrderWithDetails[]
  suppliers: Supplier[]
  products: ProductOption[]
  canManage: boolean
}

export function PurchaseOrdersPageClient({
  purchaseOrders,
  suppliers,
  products,
  canManage,
}: PurchaseOrdersPageClientProps) {
  const [showNewPO, setShowNewPO] = useState(false)
  const [supplierFilter, setSupplierFilter] = useState('Todos')
  const { t } = useLocale()

  const filteredPOs = useMemo(
    () => (supplierFilter === 'Todos' ? purchaseOrders : purchaseOrders.filter((po) => po.supplier_id === supplierFilter)),
    [purchaseOrders, supplierFilter]
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-navy">{t('purchaseOrders.title')}</h1>
          <p className="mt-1 text-slate">{t('purchaseOrders.subtitle')}</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowNewPO(true)}
            className="rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover"
          >
            {t('purchaseOrders.new')}
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate">{t('purchaseOrders.supplierLabel')}</span>
            <button
              type="button"
              onClick={() => setSupplierFilter('Todos')}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                supplierFilter === 'Todos' ? 'bg-navy text-white' : 'bg-white text-slate border border-[#E5E9EF] hover:bg-tint-blue'
              }`}
            >
              {t('purchaseOrders.supplierAll')}
            </button>
            {suppliers.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSupplierFilter(s.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  supplierFilter === s.id ? 'bg-navy text-white' : 'bg-white text-slate border border-[#E5E9EF] hover:bg-tint-blue'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          <PurchaseOrdersTable purchaseOrders={filteredPOs} canManage={canManage} />
        </div>
        <div>
          <SuppliersPanel suppliers={suppliers} canManage={canManage} />
        </div>
      </div>

      {showNewPO && (
        <PurchaseOrderFormModal
          suppliers={suppliers}
          products={products}
          onClose={() => setShowNewPO(false)}
        />
      )}
    </div>
  )
}
