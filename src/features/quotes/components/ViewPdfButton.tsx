'use client'

import { useState } from 'react'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'

interface ViewPdfButtonProps {
  url: string
  label: string
  closeLabel: string
  className?: string
}

/**
 * Un <a target="_blank"> o un window.open hacia la ruta del PDF terminaban
 * fallando en distintos navegadores/configuraciones: algunos descargan el
 * PDF en vez de mostrarlo (segun la config del navegador), y el truco de
 * Object URL en una pestaña nueva choca con la restriccion de Chrome que
 * bloquea en silencio navegar una ventana a un blob: creado en otro
 * contexto. Un <iframe> embebido en un modal DENTRO de la misma pagina no
 * tiene ninguno de esos problemas: el navegador siempre renderiza PDF
 * embebido con su visor nativo, sin importar la config de descargas ni
 * bloqueadores de popups.
 */
export function ViewPdfButton({ url, label, closeLabel, className }: ViewPdfButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  useEscapeClose(() => setIsOpen(false))

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={className}>
        {label}
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setIsOpen(false)}>
          <div
            className="flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end border-b border-[#E5E9EF] px-4 py-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate transition-colors hover:bg-tint-blue hover:text-navy"
              >
                {closeLabel}
              </button>
            </div>
            <iframe src={url} title={label} className="flex-1 border-0" />
          </div>
        </div>
      )}
    </>
  )
}
