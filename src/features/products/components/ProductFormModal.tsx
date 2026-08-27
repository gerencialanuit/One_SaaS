'use client'

import { useState } from 'react'
import { createProduct, updateProduct } from '@/actions/products'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import type { ProductWithAvailability, SupplierOption } from '../types'

interface ProductFormModalProps {
  product: ProductWithAvailability | null
  suppliers: SupplierOption[]
  onClose: () => void
}

export function ProductFormModal({ product, suppliers, onClose }: ProductFormModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url ?? null)
  const [supplyModel, setSupplyModel] = useState(product?.supply_model ?? 'inventario')

  useEscapeClose(onClose)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = product
      ? await updateProduct(product.id, formData)
      : await createProduct(formData)

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
      <div className="w-full max-w-lg rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-xl font-semibold text-navy">
          {product ? 'Editar producto' : 'Nuevo producto'}
        </h2>

        <form action={handleSubmit} className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#E5E9EF] bg-tint-blue">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-slate-muted">Sin foto</span>
              )}
            </div>
            <div className="flex-1">
              <label htmlFor="image" className="block text-sm font-medium text-navy">Foto del producto</label>
              <input
                id="image"
                name="image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                className="mt-1 block w-full text-sm text-slate file:mr-3 file:rounded-md file:border-0 file:bg-tint-blue file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-blue hover:file:bg-brand-blue/10"
              />
              <p className="mt-1 text-xs text-slate-muted">PNG, JPG o WEBP. Máx 5MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-navy">Nombre</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={product?.name ?? ''}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-navy">SKU</label>
              <input
                id="sku"
                name="sku"
                type="text"
                defaultValue={product?.sku ?? ''}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-navy">Categoría</label>
              <input
                id="category"
                name="category"
                type="text"
                required
                placeholder="Cámaras, sensores, automatización..."
                defaultValue={product?.category ?? ''}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy placeholder-slate-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-navy">Marca</label>
              <input
                id="brand"
                name="brand"
                type="text"
                placeholder="Hikvision, Ajax..."
                defaultValue={product?.brand ?? ''}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy placeholder-slate-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            <div>
              <label htmlFor="supplier_id" className="block text-sm font-medium text-navy">Proveedor</label>
              <select
                id="supplier_id"
                name="supplier_id"
                defaultValue={product?.supplier_id ?? ''}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              >
                <option value="">Sin proveedor</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="unit_price" className="block text-sm font-medium text-navy">Precio venta</label>
              <input
                id="unit_price"
                name="unit_price"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={product?.unit_price ?? ''}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            <div>
              <label htmlFor="unit_cost" className="block text-sm font-medium text-navy">Costo</label>
              <input
                id="unit_cost"
                name="unit_cost"
                type="number"
                step="0.01"
                min="0"
                defaultValue={product?.unit_cost ?? ''}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-navy">Moneda del costo</label>
              <select
                id="currency"
                name="currency"
                defaultValue={product?.currency ?? 'COP'}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              >
                <option value="COP">COP — Peso colombiano</option>
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="OTRA">Otra</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-navy">Estado</label>
              <select
                id="condition"
                name="condition"
                defaultValue={product?.condition ?? 'nuevo'}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              >
                <option value="nuevo">Nuevo</option>
                <option value="usado">Usado</option>
                <option value="averiado">Averiado</option>
              </select>
            </div>
            <div>
              <label htmlFor="supply_model" className="block text-sm font-medium text-navy">Abastecimiento</label>
              <select
                id="supply_model"
                name="supply_model"
                value={supplyModel}
                onChange={(e) => setSupplyModel(e.target.value as 'inventario' | 'bajo_pedido')}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              >
                <option value="inventario">Modelo de inventarios</option>
                <option value="bajo_pedido">Bajo pedido</option>
              </select>
            </div>
            <div>
              <label htmlFor="low_stock_threshold" className="block text-sm font-medium text-navy">Umbral stock bajo</label>
              <input
                id="low_stock_threshold"
                name="low_stock_threshold"
                type="number"
                min="0"
                disabled={supplyModel === 'bajo_pedido'}
                defaultValue={product?.low_stock_threshold ?? 5}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 disabled:bg-tint-blue/40 disabled:text-slate-muted"
              />
              {supplyModel === 'bajo_pedido' && (
                <p className="mt-1 text-xs text-slate-muted">No aplica: este producto no se mantiene en inventario.</p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 font-medium text-slate hover:text-navy"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover disabled:opacity-50"
            >
              {loading ? 'Guardando...' : product ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
