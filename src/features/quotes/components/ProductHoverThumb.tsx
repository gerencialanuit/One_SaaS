'use client'

import { createPortal } from 'react-dom'
import { ProductHoverCardContent } from './ProductHoverCardContent'
import { useClickCard } from '../hooks/useClickCard'
import type { QuoteProductOption } from '../types'

const CARD_WIDTH = 300

export function ProductHoverThumb({ product }: { product: QuoteProductOption }) {
  const { pos, toggle, triggerRef, popupRef } = useClickCard(CARD_WIDTH)

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    toggle(e.currentTarget.getBoundingClientRect())
  }

  return (
    <div
      ref={triggerRef as React.RefObject<HTMLDivElement>}
      onClick={handleClick}
      className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-[#E5E9EF] bg-tint-blue"
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
            ref={popupRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: CARD_WIDTH, zIndex: 100 }}
            className="rounded-lg border border-[#E5E9EF] bg-white p-3 shadow-lg"
          >
            <ProductHoverCardContent product={product} />
          </div>,
          document.body
        )}
    </div>
  )
}
