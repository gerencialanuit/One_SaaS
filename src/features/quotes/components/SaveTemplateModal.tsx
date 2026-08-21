'use client'

import { useState } from 'react'
import { createQuoteTemplate } from '@/actions/quote-templates'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import type { CartZone } from './CartPanel'

interface SaveTemplateModalProps {
  zones: CartZone[]
  isGerente: boolean
  onClose: () => void
  onSaved: () => void
}

export function SaveTemplateModal({ zones, isGerente, onClose, onSaved }: SaveTemplateModalProps) {
  const [name, setName] = useState('')
  const [isShared, setIsShared] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEscapeClose(onClose)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const items = zones.flatMap((zone) =>
      zone.items.map(({ product, quantity }) => ({
        product_id: product.id,
        quantity,
        zone_name: zone.name,
      }))
    )

    if (items.length === 0) {
      setError('Agrega productos al carrito antes de guardar una plantilla')
      setLoading(false)
      return
    }

    formData.set('items', JSON.stringify(items))
    formData.set('is_shared', String(isShared))

    const result = await createQuoteTemplate(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-xl font-semibold text-navy">Guardar como plantilla</h2>
        <p className="mt-1 text-sm text-slate">
          Guarda los productos y zonas actuales del carrito para reutilizarlos en otra cotización.
        </p>

        <form action={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="template_name" className="block text-sm font-medium text-navy">Nombre de la plantilla</label>
            <input
              id="template_name"
              name="name"
              type="text"
              required
              placeholder="Paquete básico cámaras..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy placeholder-slate-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>

          {isGerente && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="h-4 w-4 rounded border-[#E5E9EF] text-brand-blue focus:ring-brand-blue/20"
              />
              <span className="text-navy">Compartir con todo el equipo</span>
            </label>
          )}

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
              {loading ? 'Guardando...' : 'Guardar plantilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
