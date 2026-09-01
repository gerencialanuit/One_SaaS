'use client'

import { useState } from 'react'
import { deleteCategory } from '@/actions/categories'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import { buildCategoryTree, flattenCategoryTree } from '../utils/category-tree'
import { CategoryFormModal } from './CategoryFormModal'
import type { Category } from '@/types/database'

interface CategoriesModalProps {
  categories: Category[]
  canManage: boolean
  onClose: () => void
}

export function CategoriesModal({ categories, canManage, onClose }: CategoriesModalProps) {
  const [formCategory, setFormCategory] = useState<Category | null | 'new'>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEscapeClose(onClose)

  const tree = buildCategoryTree(categories)
  const flattened = flattenCategoryTree(tree)

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)
    const result = await deleteCategory(id)
    if (result?.error) setError(result.error)
    setDeletingId(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-navy">Categorías</h2>
          {canManage && (
            <button
              type="button"
              onClick={() => setFormCategory('new')}
              className="text-sm font-medium text-brand-blue hover:text-brand-blue-hover"
            >
              + Nueva categoría
            </button>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {flattened.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate">No hay categorías todavía.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[#E5E9EF]">
            {flattened.map(({ category, depth }) => (
              <li key={category.id} className="flex items-center justify-between py-2.5 text-sm" style={{ paddingLeft: depth * 20 }}>
                <span className="text-navy">{depth > 0 ? '— ' : ''}{category.name}</span>
                {canManage && (
                  <div className="flex shrink-0 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormCategory(category)}
                      className="font-medium text-brand-blue hover:text-brand-blue-hover"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === category.id}
                      onClick={() => handleDelete(category.id)}
                      className="font-medium text-slate hover:text-red-600 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
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

      {formCategory && (
        <CategoryFormModal
          category={formCategory === 'new' ? null : formCategory}
          tree={tree}
          onClose={() => setFormCategory(null)}
        />
      )}
    </div>
  )
}
