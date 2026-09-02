'use client'

import { useMemo, useState } from 'react'
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
import type { TranslationKey } from '@/lib/i18n/translations'

const STATUS_FILTER_KEYS: Record<'all' | 'active' | 'inactive', TranslationKey> = {
  all: 'products.filters.status.all',
  active: 'products.filters.status.active',
  inactive: 'products.filters.status.inactive',
}

const CSV_HEADERS = [
  'sku',
  'name',
  'description',
  'category',
  'subcategory',
  'brand',
  'line',
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
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [brandFilter, setBrandFilter] = useState('')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const { t } = useLocale()

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])
  const rootCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories])

  function rootCategoryIdOf(product: ProductWithAvailability): string | null {
    const category = product.category
    if (!category) return null
    return category.parent_id ?? category.id
  }

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        search.trim() === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'Todas' || rootCategoryIdOf(p) === categoryFilter
      const matchesBrand = !brandFilter || p.brand_id === brandFilter
      const matchesSupplier = !supplierFilter || p.supplier_id === supplierFilter
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? p.is_active : !p.is_active)
      return matchesSearch && matchesCategory && matchesBrand && matchesSupplier && matchesStatus
    })
  }, [products, search, categoryFilter, brandFilter, supplierFilter, statusFilter])

  function handleExport() {
    const rows = filteredProducts.map((p) => {
      const category = p.category
      const rootCategory = category?.parent_id ? categoryById.get(category.parent_id) ?? null : category
      const subcategoryName = category?.parent_id ? category.name : ''

      return [
        p.sku ?? '',
        p.name,
        p.description ?? '',
        rootCategory?.name ?? '',
        subcategoryName,
        p.brand?.name ?? '',
        p.line ?? '',
        p.condition,
        p.supply_model,
        p.currency,
        p.unit_price,
        p.unit_cost ?? '',
        p.low_stock_threshold,
        p.is_active ? 'true' : 'false',
        p.reference_url ?? '',
      ]
    })
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
        <input
          type="text"
          placeholder={t('products.filters.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-[#E5E9EF] bg-white px-4 py-2.5 text-navy placeholder-slate-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter('Todas')}
            className={
              categoryFilter === 'Todas'
                ? 'rounded-full bg-brand-blue-dark px-4 py-1.5 text-sm font-medium text-white'
                : 'rounded-full border border-[#E5E9EF] bg-white px-4 py-1.5 text-sm font-medium text-slate transition-colors hover:bg-tint-blue hover:text-navy'
            }
          >
            {t('quoteBuilder.categoryAll')}
          </button>
          {rootCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryFilter(c.id)}
              className={
                categoryFilter === c.id
                  ? 'rounded-full bg-brand-blue-dark px-4 py-1.5 text-sm font-medium text-white'
                  : 'rounded-full border border-[#E5E9EF] bg-white px-4 py-1.5 text-sm font-medium text-slate transition-colors hover:bg-tint-blue hover:text-navy'
              }
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="rounded-md border border-[#E5E9EF] bg-white px-3 py-1.5 text-sm text-navy outline-none focus:border-brand-blue"
          >
            <option value="">{t('products.filters.allBrands')}</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="rounded-md border border-[#E5E9EF] bg-white px-3 py-1.5 text-sm text-navy outline-none focus:border-brand-blue"
          >
            <option value="">{t('products.filters.allSuppliers')}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={
                  statusFilter === status
                    ? 'rounded-full bg-navy px-3 py-1 text-xs font-medium text-white'
                    : 'rounded-full border border-[#E5E9EF] bg-white px-3 py-1 text-xs font-medium text-slate transition-colors hover:bg-tint-blue hover:text-navy'
                }
              >
                {t(STATUS_FILTER_KEYS[status])}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <ProductsTable
          products={filteredProducts}
          canManage={canManage}
          categories={categories}
          brands={brands}
          suppliers={suppliers}
          onEdit={(product) => setModalProduct(product)}
          openPurchaseOrders={openPurchaseOrders}
          hasActiveFilters={
            search.trim() !== '' || categoryFilter !== 'Todas' || !!brandFilter || !!supplierFilter || statusFilter !== 'all'
          }
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
