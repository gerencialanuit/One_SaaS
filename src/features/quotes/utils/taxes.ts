export type TaxKind = 'add' | 'withhold'

export interface TaxLine {
  name: string
  rate: number
  kind: TaxKind
  enabled: boolean
}

export interface ComputedTaxLine extends TaxLine {
  amount: number
}

export interface TaxSummary {
  taxes: ComputedTaxLine[]
  addedAmount: number
  withheldAmount: number
  total: number
}

export const LABOR_LINE_NAME = 'Mano de obra'

/**
 * Impuestos por defecto para una cotizacion nueva en Colombia:
 * - IVA 19%: se suma al total facturado, activo por defecto.
 * - Retencion en la fuente: informativa (el cliente la retiene al pagar,
 *   no cambia lo que la empresa factura), tasa editable, apagada por defecto.
 * La mano de obra NO va aqui: se maneja aparte porque, a diferencia de estas,
 * resta de la base sobre la que se calcula el IVA (ver computeQuoteTotals).
 */
export const DEFAULT_TAX_LINES: TaxLine[] = [
  { name: 'IVA', rate: 19, kind: 'add', enabled: true },
  { name: 'Retención en la fuente', rate: 11, kind: 'withhold', enabled: false },
]

export const DEFAULT_LABOR_RATE = 10

export function computeTaxes(base: number, taxLines: TaxLine[]): TaxSummary {
  const taxes: ComputedTaxLine[] = taxLines.map((tax) => ({
    ...tax,
    amount: tax.enabled ? Math.round(base * (tax.rate / 100)) : 0,
  }))

  const addedAmount = taxes.filter((t) => t.kind === 'add' && t.enabled).reduce((sum, t) => sum + t.amount, 0)
  const withheldAmount = taxes.filter((t) => t.kind === 'withhold' && t.enabled).reduce((sum, t) => sum + t.amount, 0)

  return {
    taxes,
    addedAmount,
    withheldAmount,
    total: base + addedAmount,
  }
}

export interface QuoteTotalsInput {
  subtotal: number
  discountPercent: number
  laborEnabled: boolean
  laborPercent: number
  taxLines: TaxLine[]
}

export interface QuoteTotals {
  subtotal: number
  discountAmount: number
  discountedSubtotal: number
  laborAmount: number
  ivaBase: number
  taxes: ComputedTaxLine[]
  addedAmount: number
  withheldAmount: number
  total: number
}

/**
 * Orden de calculo del carrito (confirmado con el negocio):
 * 1. subtotal - descuento% = subtotal con descuento
 * 2. mano de obra% se calcula SOBRE el subtotal con descuento, y se resta de
 *    esa base — la mano de obra no paga IVA, solo los materiales/productos.
 * 3. IVA (y retencion, informativa) se calculan sobre esa base ya sin mano de obra.
 * 4. Total a facturar = base sin mano de obra + IVA + mano de obra (la mano de
 *    obra SI se sigue cobrando, solo queda fuera de la base gravable de IVA).
 */
export function computeQuoteTotals(input: QuoteTotalsInput): QuoteTotals {
  const discountedSubtotal = input.subtotal * (1 - input.discountPercent / 100)
  const discountAmount = input.subtotal - discountedSubtotal
  const laborAmount = input.laborEnabled ? Math.round(discountedSubtotal * (input.laborPercent / 100)) : 0
  const ivaBase = discountedSubtotal - laborAmount

  const taxSummary = computeTaxes(ivaBase, input.taxLines)

  return {
    subtotal: input.subtotal,
    discountAmount,
    discountedSubtotal,
    laborAmount,
    ivaBase,
    taxes: taxSummary.taxes,
    addedAmount: taxSummary.addedAmount,
    withheldAmount: taxSummary.withheldAmount,
    total: taxSummary.total + laborAmount,
  }
}

const DISPLAY_ORDER = [LABOR_LINE_NAME, 'IVA']

export function sortTaxesForDisplay<T extends { name: string }>(taxes: T[]): T[] {
  return [...taxes].sort((a, b) => {
    const ai = DISPLAY_ORDER.indexOf(a.name)
    const bi = DISPLAY_ORDER.indexOf(b.name)
    return (ai === -1 ? DISPLAY_ORDER.length : ai) - (bi === -1 ? DISPLAY_ORDER.length : bi)
  })
}
