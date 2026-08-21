'use client'

import { useMemo, useState } from 'react'
import { createQuoteVersion } from '@/actions/quote-versions'
import { computeQuoteEstimate, type IncomingOrder } from '../utils/estimate'
import { computeQuoteTotals, DEFAULT_LABOR_RATE, DEFAULT_TAX_LINES, LABOR_LINE_NAME, type TaxLine } from '../utils/taxes'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'
import type { QuoteProductOption, QuoteItemWithProduct } from '../types'
import type { QuoteTax } from '@/types/database'

interface ItemRow {
  product_id: string
  quantity: string
}

interface QuoteEditModalProps {
  quoteId: string
  products: QuoteProductOption[]
  incomingOrders: IncomingOrder[]
  currentItems: QuoteItemWithProduct[]
  currentTaxes: QuoteTax[]
  currentDiscountPercent: number
  maxDiscountPercent: number
  onClose: () => void
}

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

export function QuoteEditModal({
  quoteId,
  products,
  incomingOrders,
  currentItems,
  currentTaxes,
  currentDiscountPercent,
  maxDiscountPercent,
  onClose,
}: QuoteEditModalProps) {
  const [rows, setRows] = useState<ItemRow[]>(
    currentItems.map((item) => ({ product_id: item.product_id, quantity: item.quantity.toString() }))
  )
  const [discountPercent, setDiscountPercent] = useState(currentDiscountPercent.toString())
  const currentLaborTax = currentTaxes.find((t) => t.name === LABOR_LINE_NAME)
  const [laborEnabled, setLaborEnabled] = useState(currentLaborTax?.enabled ?? false)
  const [laborPercent, setLaborPercent] = useState(currentLaborTax?.rate ?? DEFAULT_LABOR_RATE)
  const [taxes, setTaxes] = useState<TaxLine[]>(() => {
    const nonLaborTaxes = currentTaxes.filter((t) => t.name !== LABOR_LINE_NAME)
    return nonLaborTaxes.length > 0
      ? nonLaborTaxes.map((t) => ({ name: t.name, rate: t.rate, kind: t.kind, enabled: t.enabled }))
      : DEFAULT_TAX_LINES
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEscapeClose(onClose)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const availability = useMemo(
    () => products.map((p) => ({ productId: p.id, unitPrice: p.unit_price, availableWithQuotes: p.available_with_quotes })),
    [products]
  )

  const estimate = useMemo(() => {
    const validRows = rows
      .filter((row) => row.product_id && Number(row.quantity) > 0)
      .map((row) => ({ productId: row.product_id, quantity: Number(row.quantity) }))
    if (validRows.length === 0) return null
    return computeQuoteEstimate(validRows, availability, incomingOrders, today)
  }, [rows, availability, incomingOrders, today])

  const discountValue = Number(discountPercent) || 0
  const exceedsLimit = discountValue > maxDiscountPercent
  const totals = useMemo(
    () =>
      computeQuoteTotals({
        subtotal: estimate?.subtotal ?? 0,
        discountPercent: discountValue,
        laborEnabled,
        laborPercent,
        taxLines: taxes,
      }),
    [estimate, discountValue, laborEnabled, laborPercent, taxes]
  )
  const total = totals.total

  function toggleTax(index: number) {
    setTaxes((prev) => prev.map((t, i) => (i === index ? { ...t, enabled: !t.enabled } : t)))
  }

  function changeTaxRate(index: number, rate: number) {
    setTaxes((prev) => prev.map((t, i) => (i === index ? { ...t, rate } : t)))
  }

  function updateRow(index: number, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function addRow() {
    setRows((prev) => [...prev, { product_id: '', quantity: '1' }])
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const items = rows
      .filter((row) => row.product_id && row.quantity)
      .map((row) => ({ product_id: row.product_id, quantity: row.quantity }))

    formData.set('items', JSON.stringify(items))
    formData.set('taxes', JSON.stringify(taxes))
    formData.set('labor_enabled', String(laborEnabled))
    formData.set('labor_percent', String(laborPercent))

    const result = await createQuoteVersion(quoteId, formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-xl font-semibold text-navy">Editar cotización</h2>
        <p className="mt-1 text-sm text-slate">Cada cambio crea una nueva versión — el historial se conserva.</p>

        <form action={handleSubmit} className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="block text-sm font-medium text-navy">Productos</span>
              <button type="button" onClick={addRow} className="text-sm font-medium text-brand-blue hover:text-brand-blue-hover">
                + Agregar producto
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {rows.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={row.product_id}
                    onChange={(e) => updateRow(index, { product_id: e.target.value })}
                    className="flex-1 rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-sm text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                  >
                    <option value="">Producto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, { quantity: e.target.value })}
                    className="w-20 rounded-md border border-[#E5E9EF] bg-white px-2 py-2 text-sm text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
                  />
                  {rows.length > 1 && (
                    <button type="button" onClick={() => removeRow(index)} className="px-2 text-slate hover:text-red-600">
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="discount_percent" className="block text-sm font-medium text-navy">
              Descuento (% — tu límite sin aprobación: {maxDiscountPercent}%)
            </label>
            <input
              id="discount_percent"
              name="discount_percent"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              className="mt-1 w-32 rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
            />
            {exceedsLimit && (
              <p className="mt-1 text-xs font-medium text-[#8A6D00]">
                Supera tu límite — quedará pendiente de aprobación del gerente.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={laborEnabled}
                onChange={() => setLaborEnabled((prev) => !prev)}
                className="h-4 w-4 rounded border-[#E5E9EF] text-brand-blue focus:ring-brand-blue/20"
              />
              <span className="flex-1 font-medium text-navy">Aplicar mano de obra</span>
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={laborPercent}
                onChange={(e) => setLaborPercent(Number(e.target.value))}
                disabled={!laborEnabled}
                className="w-16 rounded-md border border-[#E5E9EF] px-2 py-1 text-right text-navy outline-none focus:border-brand-blue disabled:opacity-50"
              />
              <span className="text-slate">%</span>
            </div>
            <p className="mt-1 text-xs text-slate-muted">Se calcula sobre el subtotal con descuento y no paga IVA.</p>
          </div>

          <div>
            <span className="block text-sm font-medium text-navy">Impuestos</span>
            <div className="mt-2 space-y-2">
              {taxes.map((tax, index) => (
                <div key={tax.name} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tax.enabled}
                    onChange={() => toggleTax(index)}
                    className="h-4 w-4 rounded border-[#E5E9EF] text-brand-blue focus:ring-brand-blue/20"
                  />
                  <span className="flex-1 text-slate">
                    {tax.name} {tax.kind === 'withhold' ? '(retención, informativa)' : ''}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    value={tax.rate}
                    onChange={(e) => changeTaxRate(index, Number(e.target.value))}
                    disabled={!tax.enabled}
                    className="w-16 rounded-md border border-[#E5E9EF] px-2 py-1 text-right text-navy outline-none focus:border-brand-blue disabled:opacity-50"
                  />
                  <span className="text-slate">%</span>
                </div>
              ))}
            </div>
          </div>

          {estimate && (
            <div className="rounded-md bg-tint-blue px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate">Subtotal</span>
                <span className="text-navy">{currency(estimate.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Descuento</span>
                <span className="text-navy">{discountValue}%</span>
              </div>
              {laborEnabled && totals.laborAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate">Mano de obra ({laborPercent}%)</span>
                  <span className="text-navy">+{currency(totals.laborAmount)}</span>
                </div>
              )}
              {totals.taxes.filter((t) => t.enabled).map((tax) => (
                <div key={tax.name} className="flex justify-between">
                  <span className="text-slate">
                    {tax.name} ({tax.rate}%){tax.kind === 'withhold' ? ' — retención' : ''}
                  </span>
                  <span className={tax.kind === 'withhold' ? 'text-slate' : 'text-navy'}>
                    {tax.kind === 'withhold' ? `−${currency(tax.amount)}` : `+${currency(tax.amount)}`}
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-semibold">
                <span className="text-slate">Total</span>
                <span className="text-navy">{currency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Entrega estimada</span>
                <span className="text-navy">{estimate.estimatedDeliveryDate ?? 'Sin fecha'}</span>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 font-medium text-slate hover:text-navy">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar nueva versión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
