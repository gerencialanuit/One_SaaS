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

const CONDITION_KEYS: Record<string, 'products.condition.new' | 'products.condition.used' | 'products.condition.damaged'> = {
  nuevo: 'products.condition.new',
  usado: 'products.condition.used',
  averiado: 'products.condition.damaged',
}

const SUPPLY_MODEL_KEYS: Record<string, 'products.supplyModel.stocked' | 'products.supplyModel.madeToOrder'> = {
  inventario: 'products.supplyModel.stocked',
  bajo_pedido: 'products.supplyModel.madeToOrder',
}

export function ProductHoverCardContent({ product }: { product: QuoteProductOption }) {
  const { t, locale } = useLocale()
  const { label, tone } = getAvailabilityLabel(product.available_with_quotes, product.supply_model, product.next_arrival_date, locale)
  const categoryPath = [product.category, product.subcategory].filter(Boolean).join(' › ')

  return (
    <>
      <div className="-mx-3 -mt-3 mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-t-lg bg-tint-blue">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="h-full w-full object-contain" />
        ) : (
          <svg className="h-10 w-10 text-brand-blue/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h16M4 4h16v16H4V4z" />
          </svg>
        )}
      </div>

      <div className="text-sm font-medium text-navy">{product.name}</div>
      {(product.brand || product.sku) && (
        <div className="text-xs text-slate-muted">{[product.brand, product.sku].filter(Boolean).join(' · ')}</div>
      )}
      {categoryPath && <div className="mt-1 text-xs text-slate">{categoryPath}</div>}
      {product.line && <div className="text-xs text-slate">{product.line}</div>}

      <div className="mt-2 flex flex-wrap gap-1">
        <span className="rounded-full bg-tint-blue px-2 py-0.5 text-[11px] font-medium text-navy">
          {t(CONDITION_KEYS[product.condition] ?? 'products.condition.new')}
        </span>
        <span className="rounded-full bg-tint-blue px-2 py-0.5 text-[11px] font-medium text-navy">
          {t(SUPPLY_MODEL_KEYS[product.supply_model] ?? 'products.supplyModel.stocked')}
        </span>
      </div>

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

      {product.reference_url && (
        <a
          href={product.reference_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2 inline-block text-xs font-medium text-brand-blue hover:text-brand-blue-hover hover:underline"
        >
          {t('products.table.viewReference')}
        </a>
      )}
    </>
  )
}
