'use client'

import { useState } from 'react'
import { deleteQuoteTemplate } from '@/actions/quote-templates'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import type { QuoteTemplateWithItems } from '../types'

interface TemplatePickerModalProps {
  templates: QuoteTemplateWithItems[]
  currentProfileId: string
  isGerente: boolean
  hasItemsInCart: boolean
  onLoad: (template: QuoteTemplateWithItems) => void
  onClose: () => void
}

function TemplateRow({
  template,
  canDelete,
  onLoad,
  showOwner,
}: {
  template: QuoteTemplateWithItems
  canDelete: boolean
  onLoad: (template: QuoteTemplateWithItems) => void
  showOwner: boolean
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deleteQuoteTemplate(template.id)
    setDeleting(false)
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[#E5E9EF] px-4 py-3">
      <div className="min-w-0">
        <div className="font-medium text-navy">{template.name}</div>
        <div className="text-xs text-slate-muted">
          {template.items.length} producto{template.items.length === 1 ? '' : 's'}
          {showOwner && (template.creator?.full_name || template.creator?.email) && (
            <> · {template.creator?.full_name || template.creator?.email}</>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => onLoad(template)}
          className="rounded-md border border-brand-blue px-3 py-1.5 text-sm font-medium text-brand-blue transition-colors hover:bg-tint-blue"
        >
          Cargar
        </button>
        {canDelete && (
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="text-slate hover:text-red-600 disabled:opacity-50"
            aria-label="Eliminar plantilla"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

export function TemplatePickerModal({
  templates,
  currentProfileId,
  isGerente,
  hasItemsInCart,
  onLoad,
  onClose,
}: TemplatePickerModalProps) {
  useEscapeClose(onClose)

  const shared = templates.filter((t) => t.is_shared)
  const mine = templates.filter((t) => !t.is_shared && t.created_by === currentProfileId)
  const others = isGerente ? templates.filter((t) => !t.is_shared && t.created_by !== currentProfileId) : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-xl font-semibold text-navy">Cargar plantilla</h2>
        <p className="mt-1 text-sm text-slate">Selecciona una plantilla para agregar sus productos al carrito.</p>

        {hasItemsInCart && (
          <p className="mt-3 rounded-md bg-brand-yellow/20 px-3 py-2 text-xs font-medium text-[#8A6D00]">
            Ya tienes productos en el carrito — cargar una plantilla los reemplazará.
          </p>
        )}

        {templates.length === 0 ? (
          <p className="mt-6 text-center text-sm text-slate">No hay plantillas todavía. Arma un carrito y guárdalo como plantilla.</p>
        ) : (
          <div className="mt-4 space-y-5">
            {shared.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-muted">Compartidas</h3>
                <div className="mt-2 space-y-2">
                  {shared.map((t) => (
                    <TemplateRow key={t.id} template={t} canDelete={isGerente} onLoad={onLoad} showOwner={isGerente} />
                  ))}
                </div>
              </div>
            )}

            {mine.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-muted">Mis plantillas</h3>
                <div className="mt-2 space-y-2">
                  {mine.map((t) => (
                    <TemplateRow key={t.id} template={t} canDelete onLoad={onLoad} showOwner={false} />
                  ))}
                </div>
              </div>
            )}

            {others.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-muted">De otros comerciales</h3>
                <div className="mt-2 space-y-2">
                  {others.map((t) => (
                    <TemplateRow key={t.id} template={t} canDelete={isGerente} onLoad={onLoad} showOwner />
                  ))}
                </div>
              </div>
            )}
          </div>
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
