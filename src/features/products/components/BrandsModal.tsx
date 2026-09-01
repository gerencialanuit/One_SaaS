'use client'

import { useState } from 'react'
import { createBrand, deleteBrand } from '@/actions/brands'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import type { Brand } from '@/types/database'

interface BrandsModalProps {
  brands: Brand[]
  canManage: boolean
  onClose: () => void
}

export function BrandsModal({ brands, canManage, onClose }: BrandsModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEscapeClose(onClose)

  async function handleCreate(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await createBrand(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    setName('')
    setLoading(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)
    const result = await deleteBrand(id)
    if (result?.error) setError(result.error)
    setDeletingId(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-xl font-semibold text-navy">Marcas</h2>
        <p className="mt-1 text-sm text-slate">
          Marcas que puedes asignar a cualquier producto (ej. Hikvision, Ajax, Ezviz).
        </p>

        {canManage && (
          <form action={handleCreate} className="mt-4 flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="brand_name" className="block text-sm font-medium text-navy">Nueva marca</label>
              <input
                id="brand_name"
                name="name"
                type="text"
                required
                placeholder="Hikvision, Ajax..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy placeholder-slate-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-blue px-4 py-2 font-medium text-white transition-colors hover:bg-brand-blue-hover disabled:opacity-50"
            >
              + Agregar
            </button>
          </form>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {brands.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate">No hay marcas todavía.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[#E5E9EF]">
            {brands.map((brand) => (
              <li key={brand.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-navy">{brand.name}</span>
                {canManage && (
                  <button
                    type="button"
                    disabled={deletingId === brand.id}
                    onClick={() => handleDelete(brand.id)}
                    className="font-medium text-slate hover:text-red-600 disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="px-3 py-2 font-medium text-slate hover:text-navy">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
