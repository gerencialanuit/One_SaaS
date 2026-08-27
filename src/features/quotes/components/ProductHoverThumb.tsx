'use client'

import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getAvailabilityLabel, type AvailabilityTone } from '../utils/availability-label'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { QuoteProductOption } from '../types'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`
const CARD_WIDTH = 224

const TONE_TEXT_CLASSES: Record<AvailabilityTone, string> = {
  ok: 'text-[#038A06]',
  low: 'text-[#8A6D00]',
  warn: 'text-[#8A6D00]',
  alert: 'text-red-600',
  info: 'text-navy',
}

export function ProductHoverThumb({ product }: { product: QuoteProductOption }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const { t, locale } = useLocale()

  function show() {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    const overflowsRight = rect.right + 8 + CARD_WIDTH > window.innerWidth
    const left = overflowsRight ? rect.left - CARD_WIDTH - 8 : rect.right + 8
    const top = Math.min(rect.top, window.innerHeight - 260)
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
            <div className="flex h-28 items-center justify-center overflow-hidden rounded-md bg-tint-blue">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <svg className="h-10 w-10 text-brand-blue/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h16M4 4h16v16H4V4z" />
                </svg>
              )}
            </div>
            <div className="mt-2 text-sm font-medium text-navy">{product.name}</div>
            {(product.brand || product.sku) && (
              <div className="text-xs text-slate-muted">{[product.brand, product.sku].filter(Boolean).join(' · ')}</div>
            )}
            <div className="mt-1 text-xs text-slate">{product.category}</div>
            <div className="mt-2 flex items-start justify-between text-sm">
              <span className="font-heading font-semibold text-navy">{currency(product.unit_price)}</span>
              {(() => {
                const { label, tone } = getAvailabilityLabel(product.available_with_quotes, product.supply_model, product.next_arrival_date, locale)
                if (product.available_with_quotes <= 0) {
                  return (
                    <span className="flex flex-col items-end gap-0.5">
                      <span className="text-red-600">{t('quoteBuilder.outOfStock')}</span>
                      <span className={`text-xs ${TONE_TEXT_CLASSES[tone]}`}>{label}</span>
                    </span>
                  )
                }
                return <span className={TONE_TEXT_CLASSES[tone]}>{label}</span>
              })()}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
