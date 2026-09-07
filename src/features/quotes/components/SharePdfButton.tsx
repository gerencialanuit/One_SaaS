'use client'

import { useState } from 'react'

interface SharePdfButtonProps {
  url: string
  filename: string
  label: string
  loadingLabel: string
  tapAgainLabel: string
  errorLabel: string
  className?: string
}

/**
 * Dentro de una PWA instalada (sobre todo en iOS) un link a un PDF se abre en
 * el visor embebido del contenedor, que NO tiene barra de herramientas: ni
 * flecha de compartir, ni guardar, ni volver. Y `<a download>` tampoco sirve
 * porque ese contenedor no tiene gestor de descargas.
 *
 * La unica forma de llegar al menu nativo del sistema (WhatsApp, Mail, Guardar
 * en Archivos) es la Web Share API con archivos. Safari exige que share() se
 * llame dentro del gesto del usuario, y generar el PDF toma varios segundos —
 * por eso el blob se cachea: si el primer toque pierde el gesto mientras se
 * genera, el segundo toque comparte al instante.
 */
export function SharePdfButton({
  url,
  filename,
  label,
  loadingLabel,
  tapAgainLabel,
  errorLabel,
  className,
}: SharePdfButtonProps) {
  const [cachedPdf, setCachedPdf] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  async function handleClick() {
    setHint(null)

    let pdf = cachedPdf
    if (!pdf) {
      setLoading(true)
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('pdf request failed')
        pdf = await response.blob()
        setCachedPdf(pdf)
      } catch {
        setLoading(false)
        setHint(errorLabel)
        return
      }
      setLoading(false)
    }

    const file = new File([pdf], filename, { type: 'application/pdf' })
    const canShareFile =
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [file] })

    if (canShareFile) {
      try {
        await navigator.share({ files: [file], title: filename })
        return
      } catch (error) {
        // El usuario cerro la hoja de compartir: no es un error.
        if (error instanceof DOMException && error.name === 'AbortError') return
        // NotAllowedError: se perdio el gesto mientras se generaba el PDF.
        // El blob ya quedo cacheado, asi que el siguiente toque si funciona.
        setHint(tapAgainLabel)
        return
      }
    }

    // Escritorio / navegadores sin Web Share de archivos: descarga normal.
    const objectUrl = URL.createObjectURL(pdf)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    link.click()
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={handleClick} disabled={loading} className={className}>
        <span className="flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-4 w-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M4 12v3.5a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5V12" />
          </svg>
          {loading ? loadingLabel : label}
        </span>
      </button>
      {hint && <span className="text-xs text-slate-muted">{hint}</span>}
    </span>
  )
}
