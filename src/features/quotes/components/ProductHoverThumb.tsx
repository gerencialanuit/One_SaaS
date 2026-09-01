'use client'

import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ProductHoverCardContent } from './ProductHoverCardContent'
import type { QuoteProductOption } from '../types'

const CARD_WIDTH = 260

export function ProductHoverThumb({ product }: { product: QuoteProductOption }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  function show() {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const overflowsRight = rect.right + 8 + CARD_WIDTH > window.innerWidth
    const left = overflowsRight ? rect.left - CARD_WIDTH - 8 : rect.right + 8
    const top = Math.min(rect.top, window.innerHeight - 300)
    setPos({ top: Math.max(top, 8), left: Math.max(left, 8) })
  }

  function hide() {
    setPos(null)
  }

  return (
    <div
      ref={ref}
      onMouseEnter={show}
      onMouseLeave={hide}
      className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-[#E5E9EF] bg-tint-blue"
    >
      {product.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <svg className="h-4 w-4 text-brand-blue/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h16M4 4h16v16H4V4z" />
          </svg>
        </div>
      )}

      {pos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: CARD_WIDTH, zIndex: 100 }}
            className="pointer-events-none rounded-lg border border-[#E5E9EF] bg-white p-3 shadow-md"
          >
            <ProductHoverCardContent product={product} />
          </div>,
          document.body
        )}
    </div>
  )
}
