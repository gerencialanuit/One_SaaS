'use client'

import { useState } from 'react'
import { createSupplier, updateSupplier } from '@/actions/suppliers'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import type { SupplierOption } from '@/features/products/types'

interface SupplierFormModalProps {
  supplier: (SupplierOption & { contact_name?: string | null; contact_phone?: string | null; contact_email?: string | null }) | null
  onClose: () => void
}

export function SupplierFormModal({ supplier, onClose }: SupplierFormModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEscapeClose(onClose)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = supplier
      ? await updateSupplier(supplier.id, formData)
      : await createSupplier(formData)

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
      <div className="w-full max-w-md rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-xl font-semibold text-navy">
          {supplier ? 'Editar proveedor' : 'Nuevo proveedor'}
        </h2>

        <form action={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-navy">Nombre</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={supplier?.name ?? ''}
              className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
          <div>
            <label htmlFor="contact_name" className="block text-sm font-medium text-navy">Contacto</label>
            <input
              id="contact_name"
              name="contact_name"
              type="text"
              defaultValue={supplier?.contact_name ?? ''}
              className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact_phone" className="block text-sm font-medium text-navy">Teléfono</label>
              <input
                id="contact_phone"
                name="contact_phone"
                type="text"
                defaultValue={supplier?.contact_phone ?? ''}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
            <div>
              <label htmlFor="contact_email" className="block text-sm font-medium text-navy">Email</label>
              <input
                id="contact_email"
                name="contact_email"
                type="email"
                defaultValue={supplier?.contact_email ?? ''}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>
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
              {loading ? 'Guardando...' : supplier ? 'Guardar cambios' : 'Crear proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
