'use client'

import { useState } from 'react'
import { toggleProductActive, bulkUpdateProducts } from '@/actions/products'
import { InventoryQuantityCell } from './InventoryQuantityCell'
import { PurchaseOrderDetailModal } from './PurchaseOrderDetailModal'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { buildCategoryTree, flattenCategoryTree } from '../utils/category-tree'
import type { TranslationKey } from '@/lib/i18n/translations'
import type { ProductWithAvailability, ProductOpenPoSummary, SupplierOption } from '../types'
import type { Category, Brand } from '@/types/database'

const CONDITION_CLASSNAMES: Record<string, string> = {
  nuevo: 'bg-[#038A06]/10 text-[#038A06]',
  usado: 'bg-brand-yellow/20 text-[#8A6D00]',
  averiado: 'bg-red-50 text-red-600',
}

const CONDITION_KEYS: Record<string, TranslationKey> = {
  nuevo: 'products.condition.new',
  usado: 'products.condition.used',
  averiado: 'products.condition.damaged',
}

const SUPPLY_MODEL_CLASSNAMES: Record<string, string> = {
  inventario: 'bg-tint-blue text-navy',
  bajo_pedido: 'bg-[#F3F0FF] text-[#6B4FBB]',
}

const SUPPLY_MODEL_KEYS: Record<string, TranslationKey> = {
  inventario: 'products.supplyModel.stocked',
  bajo_pedido: 'products.supplyModel.madeToOrder',
}

interface ProductsTableProps {
  products: ProductWithAvailability[]
  canManage: boolean
  categories: Category[]
  brands: Brand[]
  suppliers: SupplierOption[]
  onEdit: (product: ProductWithAvailability) => void
  openPurchaseOrders: Record<string, ProductOpenPoSummary>
  hasActiveFilters?: boolean
}

export function ProductsTable({ products, canManage, categories, brands, suppliers, onEdit, openPurchaseOrders, hasActiveFilters }: ProductsTableProps) {
  const [detailProduct, setDetailProduct] = useState<ProductWithAvailability | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkCategoryId, setBulkCategoryId] = useState('')
  const [bulkBrandId, setBulkBrandId] = useState('')
  const [bulkSupplierId, setBulkSupplierId] = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const { t } = useLocale()

  const flattenedCategories = flattenCategoryTree(buildCategoryTree(categories))
  const categoryById = new Map(categories.map((c) => [c.id, c]))

  function categoryPath(category: Category | null): string {
    if (!category) return '—'
    if (category.parent_id) {
      const parent = categoryById.get(category.parent_id)
      return parent ? `${parent.name} › ${category.name}` : category.name
    }
    return category.name
  }

  const allSelected = products.length > 0 && selectedIds.length === products.length

  function toggleAll() {
    setSelectedIds(allSelected ? [] : products.map((p) => p.id))
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function runBulkUpdate(changes: Parameters<typeof bulkUpdateProducts>[1]) {
    setBulkLoading(true)
    await bulkUpdateProducts(selectedIds, changes)
    setBulkLoading(false)
    setSelectedIds([])
    setBulkCategoryId('')
    setBulkBrandId('')
    setBulkSupplierId('')
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E9EF] bg-white p-8 text-center text-slate">
        {hasActiveFilters ? t('products.filters.noResults') : t('products.table.empty')}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#E5E9EF] bg-white shadow-sm">
      {canManage && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-[#E5E9EF] bg-tint-blue/40 px-4 py-3">
          <span className="text-sm font-medium text-navy">
            {t('products.bulk.selected', { n: selectedIds.length })}
          </span>

          <select
            value={bulkCategoryId}
            disabled={bulkLoading}
            onChange={(e) => {
              const value = e.target.value
              setBulkCategoryId(value)
              if (value) runBulkUpdate({ category_id: value })
            }}
            className="rounded-md border border-[#E5E9EF] bg-white px-2 py-1.5 text-sm text-navy outline-none focus:border-brand-blue"
          >
            <option value="">{t('products.bulk.changeCategory')}</option>
            {flattenedCategories.map(({ category: c, depth }) => (
              <option key={c.id} value={c.id}>{'—'.repeat(depth)} {c.name}</option>
            ))}
          </select>

          <select
            value={bulkBrandId}
            disabled={bulkLoading}
            onChange={(e) => {
              const value = e.target.value
              setBulkBrandId(value)
              if (value) runBulkUpdate({ brand_id: value })
            }}
            className="rounded-md border border-[#E5E9EF] bg-white px-2 py-1.5 text-sm text-navy outline-none focus:border-brand-blue"
          >
            <option value="">{t('products.bulk.changeBrand')}</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={bulkSupplierId}
            disabled={bulkLoading}
            onChange={(e) => {
              const value = e.target.value
              setBulkSupplierId(value)
              runBulkUpdate({ supplier_id: value || null })
            }}
            className="rounded-md border border-[#E5E9EF] bg-white px-2 py-1.5 text-sm text-navy outline-none focus:border-brand-blue"
          >
            <option value="">{t('products.bulk.changeSupplier')}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <button
            type="button"
            disabled={bulkLoading}
            onClick={() => runBulkUpdate({ is_active: true })}
            className="rounded-md border border-[#E5E9EF] px-3 py-1.5 text-sm font-medium text-slate hover:border-navy hover:text-navy disabled:opacity-50"
          >
            {t('products.table.activate')}
          </button>
          <button
            type="button"
            disabled={bulkLoading}
            onClick={() => runBulkUpdate({ is_active: false })}
            className="rounded-md border border-[#E5E9EF] px-3 py-1.5 text-sm font-medium text-slate hover:border-navy hover:text-navy disabled:opacity-50"
          >
            {t('products.table.deactivate')}
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="ml-auto text-sm font-medium text-slate hover:text-navy"
          >
            {t('products.bulk.clearSelection')}
          </button>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E5E9EF] text-left text-slate">
            {canManage && (
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 rounded border-[#E5E9EF]" />
              </th>
            )}
            <th className="px-4 py-3 font-medium">{t('products.table.product')}</th>
            <th className="px-4 py-3 font-medium">{t('products.table.brand')}</th>
            <th className="px-4 py-3 font-medium">{t('products.table.category')}</th>
            <th className="px-4 py-3 font-medium">{t('products.table.price')}</th>
            <th className="px-4 py-3 font-medium">{t('products.table.cost')}</th>
            <th className="px-4 py-3 font-medium">{t('products.table.condition')}</th>
            <th className="px-4 py-3 font-medium">{t('products.table.supplyModel')}</th>
            <th className="px-4 py-3 font-medium">{t('products.table.physical')}</th>
            <th className="px-4 py-3 font-medium">{t('products.table.committed')}</th>
            <th className="px-4 py-3 font-medium">{t('products.table.availability')}</th>
            <th className="px-4 py-3 font-medium">{t('products.table.poQuantity')}</th>
            <th className="px-4 py-3 font-medium">{t('products.table.nextArrival')}</th>
            {canManage && <th className="px-4 py-3 font-medium">{t('products.table.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const availability = product.availability
            const available = availability?.available_with_quotes ?? 0
            const isLowStock = product.supply_model === 'inventario' && available <= product.low_stock_threshold
            const poSummary = openPurchaseOrders[product.id]

            return (
              <tr key={product.id} className="border-b border-[#E5E9EF] hover:bg-tint-blue/50">
                {canManage && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleOne(product.id)}
                      className="h-4 w-4 rounded border-[#E5E9EF]"
                    />
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#E5E9EF] bg-tint-blue">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-slate-muted">{t('products.table.noPhoto')}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-navy">{product.name}</div>
                      {product.sku && <div className="text-xs text-slate-muted">{product.sku}</div>}
                      {product.reference_url && (
                        <a
                          href={product.reference_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-brand-blue hover:text-brand-blue-hover hover:underline"
                        >
                          {t('products.table.viewReference')}
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate">{product.brand?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate">{categoryPath(product.category)}</td>
                <td className="px-4 py-3 text-navy">
                  ${product.unit_price.toLocaleString('es-CO')}
                </td>
                <td className="px-4 py-3 text-slate">
                  {product.unit_cost != null ? `$${product.unit_cost.toLocaleString('es-CO')}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CONDITION_CLASSNAMES[product.condition] ?? ''}`}>
                    {CONDITION_KEYS[product.condition] ? t(CONDITION_KEYS[product.condition]) : product.condition}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${SUPPLY_MODEL_CLASSNAMES[product.supply_model] ?? ''}`}>
                    {SUPPLY_MODEL_KEYS[product.supply_model] ? t(SUPPLY_MODEL_KEYS[product.supply_model]) : product.supply_model}
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
                        {t('products.table.lowStock')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {poSummary && poSummary.totalQuantity > 0 ? (
                    <button
                      type="button"
                      onClick={() => setDetailProduct(product)}
                      className="font-semibold text-brand-blue hover:text-brand-blue-hover hover:underline"
                    >
                      {poSummary.totalQuantity}
                    </button>
                  ) : (
                    <span className="text-slate-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate">{poSummary?.nearestDate ?? '—'}</td>
                {canManage && (
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="font-medium text-brand-blue hover:text-brand-blue-hover"
                      >
                        {t('products.table.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleProductActive(product.id, !product.is_active)}
                        className="font-medium text-slate hover:text-navy"
                      >
                        {product.is_active ? t('products.table.deactivate') : t('products.table.activate')}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>

      {detailProduct && openPurchaseOrders[detailProduct.id] && (
        <PurchaseOrderDetailModal
          productName={detailProduct.name}
          summary={openPurchaseOrders[detailProduct.id]}
          onClose={() => setDetailProduct(null)}
        />
      )}
    </div>
  )
}
