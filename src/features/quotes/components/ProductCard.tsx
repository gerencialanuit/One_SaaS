import { getAvailabilityLabel, type AvailabilityTone } from '../utils/availability-label'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { QuoteProductOption } from '../types'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

interface ProductCardProps {
  product: QuoteProductOption
  quantityInCart: number
  onAdd: () => void
  isFavorite: boolean
  onToggleFavorite: () => void
}

const TONE_CLASSES: Record<AvailabilityTone, string> = {
  ok: 'bg-[#038A06]/10 text-[#038A06]',
  low: 'bg-brand-yellow/20 text-[#8A6D00]',
  warn: 'bg-brand-yellow/20 text-[#8A6D00]',
  alert: 'bg-red-50 text-red-600',
  info: 'bg-tint-blue text-navy',
}

function AvailabilityBadge({ product }: { product: QuoteProductOption }) {
  const { t, locale } = useLocale()
  const { label, tone } = getAvailabilityLabel(product.available_with_quotes, product.supply_model, product.next_arrival_date, locale)

  if (product.available_with_quotes <= 0) {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
          {t('quoteBuilder.outOfStock')}
        </span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${TONE_CLASSES[tone]}`}>
          {label}
        </span>
      </div>
    )
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${TONE_CLASSES[tone]}`}>
      {label}
    </span>
  )
}

export function ProductCard({ product, quantityInCart, onAdd, isFavorite, onToggleFavorite }: ProductCardProps) {
  const { t } = useLocale()
  return (
    <div className="overflow-hidden rounded-lg border border-[#E5E9EF] bg-white shadow-sm">
      <div className="relative flex h-28 items-center justify-center bg-tint-blue">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <svg className="h-10 w-10 text-brand-blue/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h16M4 4h16v16H4V4z" />
          </svg>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite()
          }}
          aria-label={isFavorite ? t('quoteBuilder.removeFavorite') : t('quoteBuilder.addFavorite')}
          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-white"
        >
          <svg
            viewBox="0 0 20 20"
            fill={isFavorite ? '#FFC414' : 'none'}
            stroke={isFavorite ? '#8A6D00' : '#64748B'}
            strokeWidth={1.5}
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.5l-4.7 2.45.9-5.23-3.8-3.7 5.25-.76L10 2.5z" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <div className="font-medium text-navy">{product.name}</div>
        {(product.brand || product.sku) && (
          <div className="text-xs text-slate-muted">{[product.brand, product.sku].filter(Boolean).join(' · ')}</div>
        )}
        <div className="mt-2 flex items-start justify-between">
          <span className="font-heading font-semibold text-navy">{currency(product.unit_price)}</span>
          <AvailabilityBadge product={product} />
        </div>

        <button
          type="button"
          onClick={onAdd}
          className={`mt-3 w-full rounded-md border py-1.5 text-sm font-medium text-navy transition-colors ${
            quantityInCart > 0
              ? 'border-navy bg-tint-blue hover:bg-tint-blue/70'
              : 'border-[#E5E9EF] hover:border-navy hover:bg-tint-blue'
          }`}
        >
          {quantityInCart > 0 ? `${t('quoteBuilder.addToCart')} (${quantityInCart} ${t('quoteBuilder.inCart')})` : t('quoteBuilder.addToCart')}
        </button>
      </div>
    </div>
  )
}
