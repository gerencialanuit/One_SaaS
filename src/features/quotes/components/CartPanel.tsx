import { ProductHoverThumb } from './ProductHoverThumb'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import type { QuoteProductOption } from '../types'
import type { QuoteEstimate } from '../utils/estimate'
import type { QuoteTotals, TaxLine } from '../utils/taxes'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

interface ClientOption {
  id: string
  name: string
}

export interface CartZone {
  id: string
  name: string
  items: { product: QuoteProductOption; quantity: number }[]
}

interface CartPanelProps {
  clients: ClientOption[]
  clientId: string
  onClientChange: (value: string) => void
  projectType: string
  onProjectTypeChange: (value: string) => void
  zones: CartZone[]
  activeZoneId: string | null
  onSetActiveZone: (zoneId: string) => void
  onAddZone: () => void
  onRenameZone: (zoneId: string, name: string) => void
  onRemoveZone: (zoneId: string) => void
  onIncrement: (zoneId: string, productId: string) => void
  onDecrement: (zoneId: string, productId: string) => void
  onRemoveItem: (zoneId: string, productId: string) => void
  estimate: QuoteEstimate | null
  subtotal: number
  discountEnabled: boolean
  discountPercent: number
  onToggleDiscount: () => void
  onChangeDiscountPercent: (value: number) => void
  maxDiscountPercent: number
  discountExceedsLimit: boolean
  laborEnabled: boolean
  laborPercent: number
  onToggleLabor: () => void
  onChangeLaborPercent: (value: number) => void
  taxes: TaxLine[]
  totals: QuoteTotals
  onToggleTax: (index: number) => void
  onChangeTaxRate: (index: number, rate: number) => void
  hasItems: boolean
  error: string | null
  loading: boolean
  onSubmit: (formData: FormData) => void
  onOpenTemplatePicker: () => void
  onOpenSaveTemplate: () => void
  isExpanded: boolean
  onToggleExpand: () => void
}

export function CartPanel({
  clients,
  clientId,
  onClientChange,
  projectType,
  onProjectTypeChange,
  zones,
  activeZoneId,
  onSetActiveZone,
  onAddZone,
  onRenameZone,
  onRemoveZone,
  onIncrement,
  onDecrement,
  onRemoveItem,
  estimate,
  subtotal,
  discountEnabled,
  discountPercent,
  onToggleDiscount,
  onChangeDiscountPercent,
  maxDiscountPercent,
  discountExceedsLimit,
  laborEnabled,
  laborPercent,
  onToggleLabor,
  onChangeLaborPercent,
  taxes,
  totals,
  onToggleTax,
  onChangeTaxRate,
  hasItems,
  error,
  loading,
  onSubmit,
  onOpenTemplatePicker,
  onOpenSaveTemplate,
  isExpanded,
  onToggleExpand,
}: CartPanelProps) {
  const { t } = useLocale()
  useEscapeClose(() => {
    if (isExpanded) onToggleExpand()
  })

  return (
    <>
      {isExpanded && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={onToggleExpand} />
      )}
      <div
        className={
          isExpanded
            ? 'fixed inset-y-6 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 overflow-y-auto rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-2xl'
            : 'sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-sm'
        }
      >
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold text-navy">{t('quoteBuilder.cartTitle')}</h2>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenTemplatePicker}
            className="rounded-md border border-[#E5E9EF] px-2.5 py-1 text-xs font-medium text-slate transition-colors hover:border-navy hover:text-navy"
          >
            {t('quoteBuilder.loadTemplate')}
          </button>
          <button
            type="button"
            onClick={onOpenSaveTemplate}
            disabled={!hasItems}
            className="rounded-md border border-[#E5E9EF] px-2.5 py-1 text-xs font-medium text-slate transition-colors hover:border-navy hover:text-navy disabled:opacity-40"
          >
            {t('quoteBuilder.saveTemplate')}
          </button>
          <button
            type="button"
            onClick={onToggleExpand}
            title={isExpanded ? t('quoteBuilder.collapse') : t('quoteBuilder.expand')}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#E5E9EF] text-slate transition-colors hover:border-navy hover:text-navy"
          >
            {isExpanded ? (
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12.5 7.5h3.5v-3.5M7.5 12.5h-3.5v3.5M16 4l-5 5M4 16l5-5" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4h4v4M8 16H4v-4M16 4l-5 5M4 16l5-5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <form action={onSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="client_id" className="block text-sm font-medium text-navy">{t('quoteBuilder.client')}</label>
          <select
            id="client_id"
            name="client_id"
            required
            value={clientId}
            onChange={(e) => onClientChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          >
            <option value="">{t('quoteBuilder.selectClient')}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="project_type" className="block text-sm font-medium text-navy">{t('quoteBuilder.projectType')}</label>
          <input
            id="project_type"
            name="project_type"
            type="text"
            required
            placeholder={t('quoteBuilder.projectTypePlaceholder')}
            value={projectType}
            onChange={(e) => onProjectTypeChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy placeholder-slate-muted outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>

        <div className={`${isExpanded ? 'max-h-[40rem]' : 'max-h-[28rem]'} space-y-3 overflow-y-auto border-t border-[#E5E9EF] pt-3`}>
          {zones.length === 0 ? (
            <p className="text-sm text-slate">{t('quoteBuilder.emptyZones')}</p>
          ) : (
            zones.map((zone) => {
              const zoneTotal = zone.items.reduce((sum, item) => sum + item.product.unit_price * item.quantity, 0)
              const isActive = zone.id === activeZoneId
              return (
                <div
                  key={zone.id}
                  onClick={() => onSetActiveZone(zone.id)}
                  className={`cursor-pointer rounded-md border p-3 ${isActive ? 'border-brand-blue bg-tint-blue/40' : 'border-[#E5E9EF]'}`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={zone.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onRenameZone(zone.id, e.target.value)}
                      className="flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm font-semibold text-navy outline-none focus:border-[#E5E9EF] focus:bg-white"
                    />
                    {isActive && (
                      <span className="rounded-full bg-brand-blue px-2 py-0.5 text-[10px] font-medium text-white">{t('quoteBuilder.zoneActive')}</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveZone(zone.id)
                      }}
                      className="text-slate hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>

                  {zone.items.length === 0 ? (
                    <p className="mt-1 pl-1.5 text-xs text-slate-muted">{t('quoteBuilder.zoneEmpty')}</p>
                  ) : (
                    <div className="mt-2 space-y-1.5">
                      {zone.items.map(({ product, quantity }) => (
                        <div key={product.id} className="flex items-center justify-between gap-2 text-sm" onClick={(e) => e.stopPropagation()}>
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <ProductHoverThumb product={product} />
                            <span className="min-w-0 flex-1 truncate text-navy">{product.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => onDecrement(zone.id, product.id)} className="flex h-5 w-5 items-center justify-center rounded-full border border-[#E5E9EF] text-xs text-navy hover:bg-white">−</button>
                            <span className="w-4 text-center text-xs text-navy">{quantity}</span>
                            <button type="button" onClick={() => onIncrement(zone.id, product.id)} className="flex h-5 w-5 items-center justify-center rounded-full border border-[#E5E9EF] text-xs text-navy hover:bg-white">+</button>
                          </div>
                          <span className="w-16 text-right text-xs font-medium text-navy">{currency(product.unit_price * quantity)}</span>
                          <button type="button" onClick={() => onRemoveItem(zone.id, product.id)} className="text-slate hover:text-red-600">×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {zone.items.length > 0 && (
                    <div className="mt-2 border-t border-[#E5E9EF] pt-1.5 text-right text-xs font-semibold text-navy">
                      {t('quoteBuilder.zoneSubtotal')} {currency(zoneTotal)}
                    </div>
                  )}
                </div>
              )
            })
          )}

          <button
            type="button"
            onClick={onAddZone}
            className="w-full rounded-md border border-dashed border-brand-blue py-2 text-sm font-medium text-brand-blue hover:bg-tint-blue"
          >
            {t('quoteBuilder.addZone')}
          </button>
        </div>

        {hasItems && (
          <div className="space-y-2 border-t border-[#E5E9EF] pt-3">
            <div className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={discountEnabled}
                onChange={onToggleDiscount}
                className="h-4 w-4 rounded border-[#E5E9EF] text-brand-blue focus:ring-brand-blue/20"
              />
              <span className="flex-1 font-medium text-navy">{t('quoteBuilder.applyDiscount')}</span>
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={discountPercent}
                onChange={(e) => onChangeDiscountPercent(Number(e.target.value))}
                disabled={!discountEnabled}
                className="w-16 rounded-md border border-[#E5E9EF] px-2 py-1 text-right text-navy outline-none focus:border-brand-blue disabled:opacity-50"
              />
              <span className="text-slate">%</span>
            </div>
            {discountExceedsLimit && (
              <p className="text-xs font-medium text-[#8A6D00]">
                {t('quoteBuilder.exceedsLimit')} ({maxDiscountPercent}%) — {t('quoteBuilder.pendingApproval')}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1 text-sm">
              <input
                type="checkbox"
                checked={laborEnabled}
                onChange={onToggleLabor}
                className="h-4 w-4 rounded border-[#E5E9EF] text-brand-blue focus:ring-brand-blue/20"
              />
              <span className="flex-1 font-medium text-navy">{t('quoteBuilder.applyLabor')}</span>
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={laborPercent}
                onChange={(e) => onChangeLaborPercent(Number(e.target.value))}
                disabled={!laborEnabled}
                className="w-16 rounded-md border border-[#E5E9EF] px-2 py-1 text-right text-navy outline-none focus:border-brand-blue disabled:opacity-50"
              />
              <span className="text-slate">%</span>
            </div>
            <p className="text-xs text-slate-muted">{t('quoteBuilder.laborHint')}</p>
          </div>
        )}

        {hasItems && (
          <div className="space-y-3 border-t border-[#E5E9EF] pt-3">
            <p className="text-sm font-medium text-navy">{t('quoteBuilder.taxes')}</p>
            <div className="space-y-2">
              {taxes.map((tax, index) => (
                <div key={tax.name} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tax.enabled}
                    onChange={() => onToggleTax(index)}
                    className="h-4 w-4 rounded border-[#E5E9EF] text-brand-blue focus:ring-brand-blue/20"
                  />
                  <span className="flex-1 text-slate">
                    {tax.name} {tax.kind === 'withhold' ? t('quoteBuilder.retentionInfo') : ''}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={tax.rate}
                    onChange={(e) => onChangeTaxRate(index, Number(e.target.value))}
                    disabled={!tax.enabled}
                    className="w-16 rounded-md border border-[#E5E9EF] px-2 py-1 text-right text-navy outline-none focus:border-brand-blue disabled:opacity-50"
                  />
                  <span className="text-slate">%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {estimate && hasItems && (
          <div className="rounded-md bg-tint-blue px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate">{t('quoteBuilder.subtotal')}</span>
              <span className="text-navy">{currency(subtotal)}</span>
            </div>
            {discountEnabled && totals.discountAmount > 0 && (
              <div className="mt-1 flex justify-between">
                <span className="text-slate">{t('quoteBuilder.discount')} ({discountPercent}%)</span>
                <span className="text-navy">−{currency(totals.discountAmount)}</span>
              </div>
            )}
            {laborEnabled && totals.laborAmount > 0 && (
              <div className="mt-1 flex justify-between">
                <span className="text-slate">{t('quoteBuilder.labor')} ({laborPercent}%)</span>
                <span className="text-navy">+{currency(totals.laborAmount)}</span>
              </div>
            )}
            {totals.taxes.filter((tax) => tax.enabled).map((tax) => (
              <div key={tax.name} className="mt-1 flex justify-between">
                <span className="text-slate">
                  {tax.name} ({tax.rate}%){tax.kind === 'withhold' ? ` — ${t('quoteBuilder.retention')}` : ''}
                </span>
                <span className={tax.kind === 'withhold' ? 'text-slate' : 'text-navy'}>
                  {tax.kind === 'withhold' ? `−${currency(tax.amount)}` : `+${currency(tax.amount)}`}
                </span>
              </div>
            ))}
            <div className="mt-1 flex justify-between font-semibold">
              <span className="text-navy">{t('quoteBuilder.totalToInvoice')}</span>
              <span className="text-navy">{currency(totals.total)}</span>
            </div>
            {totals.withheldAmount > 0 && (
              <div className="mt-0.5 flex justify-between text-xs text-slate-muted">
                <span>{t('quoteBuilder.withholdingEstimate')}</span>
                <span>{currency(totals.withheldAmount)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between">
              <span className="text-slate">{t('quoteBuilder.estimatedDelivery')}</span>
              <span className="text-navy">{estimate.estimatedDeliveryDate ?? t('quoteBuilder.noDate')}</span>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !hasItems}
          className="w-full rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover disabled:opacity-50"
        >
          {loading ? t('quoteBuilder.submitting') : t('quoteBuilder.submit')}
        </button>
      </form>
      </div>
    </>
  )
}
