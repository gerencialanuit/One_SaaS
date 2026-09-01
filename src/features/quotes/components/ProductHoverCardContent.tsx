import { getAvailabilityLabel, type AvailabilityTone } from '../utils/availability-label'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { QuoteProductOption } from '../types'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

const TONE_TEXT_CLASSES: Record<AvailabilityTone, string> = {
  ok: 'text-[#038A06]',
  low: 'text-[#8A6D00]',
  warn: 'text-[#8A6D00]',
  alert: 'text-red-600',
  info: 'text-navy',
}

export function ProductHoverCardContent({ product }: { product: QuoteProductOption }) {
  const { t, locale } = useLocale()
  const { label, tone } = getAvailabilityLabel(product.available_with_quotes, product.supply_model, product.next_arrival_date, locale)

  return (
    <>
      <div className="text-sm font-medium text-navy">{product.name}</div>
      {(product.brand || product.sku) && (
        <div className="text-xs text-slate-muted">{[product.brand, product.sku].filter(Boolean).join(' · ')}</div>
      )}
      <div className="mt-1 text-xs text-slate">{product.category}</div>
      {product.description && (
        <p className="mt-2 text-xs text-slate">{product.description}</p>
      )}
      <div className="mt-2 flex items-start justify-between text-sm">
        <span className="font-heading font-semibold text-navy">{currency(product.unit_price)}</span>
        {product.available_with_quotes <= 0 ? (
          <span className="flex flex-col items-end gap-0.5">
            <span className="text-red-600">{t('quoteBuilder.outOfStock')}</span>
            <span className={`text-xs ${TONE_TEXT_CLASSES[tone]}`}>{label}</span>
          </span>
        ) : (
          <span className={TONE_TEXT_CLASSES[tone]}>{label}</span>
        )}
      </div>
    </>
  )
}
