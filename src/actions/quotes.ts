'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'
import { computeQuoteEstimate, type IncomingOrder } from '@/features/quotes/utils/estimate'
import { computeQuoteTotals, DEFAULT_TAX_LINES, LABOR_LINE_NAME, type TaxLine } from '@/features/quotes/utils/taxes'

const itemSchema = z.object({
  product_id: z.string().trim().min(1),
  quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
  zone_name: z.string().trim().optional(),
})

const taxLineSchema = z.object({
  name: z.string().trim().min(1),
  rate: z.coerce.number().min(0).max(100),
  kind: z.enum(['add', 'withhold']),
  enabled: z.boolean(),
})

const quoteSchema = z.object({
  client_id: z.string().trim().min(1, 'Selecciona un cliente'),
  project_type: z.string().trim().min(1, 'El tipo de proyecto es requerido'),
  items: z.array(itemSchema).min(1, 'Agrega al menos un producto'),
  taxes: z.array(taxLineSchema).optional(),
  discount_percent: z.coerce.number().min(0, 'El descuento no puede ser negativo').max(100, 'El descuento no puede superar 100%').default(0),
  labor_enabled: z.string().optional().transform((v) => v === 'true'),
  labor_percent: z.coerce.number().min(0, 'La mano de obra no puede ser negativa').max(100, 'La mano de obra no puede superar 100%').default(0),
})

export async function createQuote(formData: FormData) {
  const profile = await getCurrentProfile()
  if (!profile || !hasRole(profile, 'comercial')) {
    return { error: 'No tienes permiso para crear cotizaciones' }
  }

  let rawItems: unknown
  let rawTaxes: unknown
  try {
    rawItems = JSON.parse((formData.get('items') as string) ?? '[]')
    rawTaxes = formData.get('taxes') ? JSON.parse(formData.get('taxes') as string) : undefined
  } catch {
    return { error: 'Items inválidos' }
  }

  const parsed = quoteSchema.safeParse({
    client_id: formData.get('client_id'),
    project_type: formData.get('project_type'),
    items: rawItems,
    taxes: rawTaxes,
    discount_percent: formData.get('discount_percent') || '0',
    labor_enabled: formData.get('labor_enabled') || undefined,
    labor_percent: formData.get('labor_percent') || '0',
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const productIds = [...new Set(parsed.data.items.map((item) => item.product_id))]

  const [{ data: availabilityRows }, { data: productsRows }, { data: poItemsRows }, { data: discountRule }] = await Promise.all([
    supabase.from('inventory_availability').select('product_id, available_with_quotes').in('product_id', productIds),
    supabase.from('products').select('id, unit_price').in('id', productIds),
    supabase.from('purchase_order_items').select('product_id, quantity, purchase_order_id').in('product_id', productIds),
    supabase.from('discount_rules').select('max_discount_percent').eq('role', profile.role).single(),
  ])

  const poIds = [...new Set((poItemsRows ?? []).map((row) => row.purchase_order_id))]
  const { data: posRows } = poIds.length
    ? await supabase
        .from('purchase_orders')
        .select('id, expected_arrival_date, status')
        .in('id', poIds)
        .neq('status', 'cancelled')
    : { data: [] }

  const poMap = new Map((posRows ?? []).map((po) => [po.id, po]))
  const priceMap = new Map((productsRows ?? []).map((p) => [p.id, p.unit_price]))
  const availabilityMap = new Map((availabilityRows ?? []).map((a) => [a.product_id, a.available_with_quotes]))

  const availability = productIds.map((id) => ({
    productId: id,
    unitPrice: priceMap.get(id) ?? 0,
    availableWithQuotes: availabilityMap.get(id) ?? 0,
  }))

  const incomingOrders: IncomingOrder[] = (poItemsRows ?? [])
    .map((row) => {
      const po = poMap.get(row.purchase_order_id)
      if (!po) return null
      return { productId: row.product_id, expectedArrivalDate: po.expected_arrival_date, quantity: row.quantity }
    })
    .filter((x): x is IncomingOrder => x !== null)

  // La disponibilidad/fecha de entrega se evalua sobre la DEMANDA TOTAL por
  // producto (sumada entre zonas), no linea por linea — dos zonas pidiendo el
  // mismo producto compiten por el mismo stock.
  const mergedQuantities = new Map<string, number>()
  for (const item of parsed.data.items) {
    mergedQuantities.set(item.product_id, (mergedQuantities.get(item.product_id) ?? 0) + item.quantity)
  }

  const today = new Date().toISOString().slice(0, 10)
  const estimate = computeQuoteEstimate(
    Array.from(mergedQuantities.entries()).map(([productId, quantity]) => ({ productId, quantity })),
    availability,
    incomingOrders,
    today
  )

  const discountPercent = parsed.data.discount_percent
  const maxDiscount = discountRule?.max_discount_percent ?? 0
  const requiresApproval = discountPercent > maxDiscount

  const taxLines: TaxLine[] = parsed.data.taxes ?? DEFAULT_TAX_LINES
  const totals = computeQuoteTotals({
    subtotal: estimate.subtotal,
    discountPercent,
    laborEnabled: parsed.data.labor_enabled,
    laborPercent: parsed.data.labor_percent,
    taxLines,
  })

  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      client_id: parsed.data.client_id,
      commercial_id: profile.id,
      project_type: parsed.data.project_type,
      status: requiresApproval ? 'pending_approval' : 'draft',
    })
    .select('id')
    .single()

  if (quoteError || !quote) {
    return { error: quoteError?.message ?? 'No se pudo crear la cotización' }
  }

  const { data: version, error: versionError } = await supabase
    .from('quote_versions')
    .insert({
      quote_id: quote.id,
      version_number: 1,
      subtotal: estimate.subtotal,
      discount_percent: discountPercent,
      total: totals.total,
      estimated_delivery_date: estimate.estimatedDeliveryDate,
      requires_approval: requiresApproval,
      created_by: profile.id,
    })
    .select('id')
    .single()

  if (versionError || !version) {
    return { error: versionError?.message ?? 'No se pudo crear la versión de la cotización' }
  }

  const { error: linkError } = await supabase
    .from('quotes')
    .update({ current_version_id: version.id })
    .eq('id', quote.id)

  if (linkError) {
    return { error: linkError.message }
  }

  const { error: itemsError } = await supabase.from('quote_items').insert(
    parsed.data.items.map((item) => ({
      quote_version_id: version.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: priceMap.get(item.product_id) ?? 0,
      zone_name: item.zone_name || null,
    }))
  )

  if (itemsError) {
    return { error: itemsError.message }
  }

  const { error: taxesError } = await supabase.from('quote_taxes').insert([
    {
      quote_version_id: version.id,
      name: LABOR_LINE_NAME,
      rate: parsed.data.labor_percent,
      kind: 'add',
      enabled: parsed.data.labor_enabled,
      amount: totals.laborAmount,
    },
    ...totals.taxes.map((tax) => ({
      quote_version_id: version.id,
      name: tax.name,
      rate: tax.rate,
      kind: tax.kind,
      enabled: tax.enabled,
      amount: tax.amount,
    })),
  ])

  if (taxesError) {
    return { error: taxesError.message }
  }

  revalidatePath('/quotes')
  return { success: true, quoteId: quote.id, requiresApproval }
}
