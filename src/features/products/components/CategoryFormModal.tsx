'use client'

import { useState } from 'react'
import { createCategory, updateCategory } from '@/actions/categories'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import { flattenCategoryTree } from '../utils/category-tree'
import type { CategoryWithChildren } from '../types'
import type { Category } from '@/types/database'

interface CategoryFormModalProps {
  category: Category | null
  tree: CategoryWithChildren[]
  onClose: () => void
}

export function CategoryFormModal({ category, tree, onClose }: CategoryFormModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEscapeClose(onClose)

  const flattened = flattenCategoryTree(tree).filter(({ category: c }) => c.id !== category?.id)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = category ? await updateCategory(category.id, formData) : await createCategory(formData)

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
      <div className="w-full max-w-sm rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-xl font-semibold text-navy">
          {category ? 'Editar categoría' : 'Nueva categoría'}
        </h2>

        <form action={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="cat_name" className="block text-sm font-medium text-navy">Nombre</label>
            <input
              id="cat_name"
              name="name"
              type="text"
              required
              defaultValue={category?.name ?? ''}
              className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
          <div>
            <label htmlFor="cat_parent" className="block text-sm font-medium text-navy">Categoría padre (opcional)</label>
            <select
              id="cat_parent"
              name="parent_id"
              defaultValue={category?.parent_id ?? ''}
              className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            >
              <option value="">Sin categoría padre</option>
              {flattened.map(({ category: c, depth }) => (
                <option key={c.id} value={c.id}>{'—'.repeat(depth)} {c.name}</option>
              ))}
            </select>
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
              {loading ? 'Guardando...' : category ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
