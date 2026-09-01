'use client'

import { useState } from 'react'
import { ProductsTable } from './ProductsTable'
import { ProductFormModal } from './ProductFormModal'
import { CategoriesModal } from './CategoriesModal'
import { AttributesModal } from './AttributesModal'
import { BrandsModal } from './BrandsModal'
import { ImportProductsModal } from './ImportProductsModal'
import { toCsv } from '../utils/csv'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { ProductWithAvailability, SupplierOption, ProductOpenPoSummary } from '../types'
import type { Category, Brand, ProductAttribute } from '@/types/database'

const CSV_HEADERS = [
  'sku',
  'name',
  'category',
  'brand',
  'condition',
  'supply_model',
  'currency',
  'unit_price',
  'unit_cost',
  'low_stock_threshold',
  'is_active',
  'reference_url',
]

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

interface ProductsPageClientProps {
  products: ProductWithAvailability[]
  suppliers: SupplierOption[]
  categories: Category[]
  brands: Brand[]
  attributes: ProductAttribute[]
  canManage: boolean
  openPurchaseOrders: Record<string, ProductOpenPoSummary>
}

export function ProductsPageClient({
  products,
  suppliers,
  categories,
  brands,
  attributes,
  canManage,
  openPurchaseOrders,
}: ProductsPageClientProps) {
  const [modalProduct, setModalProduct] = useState<ProductWithAvailability | null | 'new'>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [showBrands, setShowBrands] = useState(false)
  const [showAttributes, setShowAttributes] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const { t } = useLocale()

  function handleExport() {
    const rows = products.map((p) => [
      p.sku ?? '',
      p.name,
      p.category?.name ?? '',
      p.brand?.name ?? '',
      p.condition,
      p.supply_model,
      p.currency,
      p.unit_price,
      p.unit_cost ?? '',
      p.low_stock_threshold,
      p.is_active ? 'true' : 'false',
      p.reference_url ?? '',
    ])
    downloadCsv('productos.csv', toCsv(CSV_HEADERS, rows))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-navy">{t('products.title')}</h1>
          <p className="mt-1 text-slate">{t('products.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCategories(true)}
            className="rounded-lg border border-[#E5E9EF] px-4 py-2.5 font-medium text-slate transition-colors hover:border-navy hover:text-navy"
          >
            {t('products.manageCategories')}
          </button>
          <button
            type="button"
            onClick={() => setShowBrands(true)}
            className="rounded-lg border border-[#E5E9EF] px-4 py-2.5 font-medium text-slate transition-colors hover:border-navy hover:text-navy"
          >
            {t('products.manageBrands')}
          </button>
          <button
            type="button"
            onClick={() => setShowAttributes(true)}
            className="rounded-lg border border-[#E5E9EF] px-4 py-2.5 font-medium text-slate transition-colors hover:border-navy hover:text-navy"
          >
            {t('products.manageAttributes')}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-[#E5E9EF] px-4 py-2.5 font-medium text-slate transition-colors hover:border-navy hover:text-navy"
          >
            {t('products.exportCsv')}
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="rounded-lg border border-[#E5E9EF] px-4 py-2.5 font-medium text-slate transition-colors hover:border-navy hover:text-navy"
            >
              {t('products.importCsv')}
            </button>
          )}
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
      </div>

      <div className="mt-6">
        <ProductsTable
          products={products}
          canManage={canManage}
          categories={categories}
          brands={brands}
          suppliers={suppliers}
          onEdit={(product) => setModalProduct(product)}
          openPurchaseOrders={openPurchaseOrders}
        />
      </div>

      {modalProduct && (
        <ProductFormModal
          product={modalProduct === 'new' ? null : modalProduct}
          suppliers={suppliers}
          categories={categories}
          brands={brands}
          attributes={attributes}
          onClose={() => setModalProduct(null)}
        />
      )}

      {showCategories && (
        <CategoriesModal categories={categories} canManage={canManage} onClose={() => setShowCategories(false)} />
      )}

      {showBrands && (
        <BrandsModal brands={brands} canManage={canManage} onClose={() => setShowBrands(false)} />
      )}

      {showAttributes && (
        <AttributesModal attributes={attributes} canManage={canManage} onClose={() => setShowAttributes(false)} />
      )}

      {showImport && <ImportProductsModal onClose={() => setShowImport(false)} />}
    </div>
  )
}
