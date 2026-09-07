'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/profile'
import { computeQuoteEstimate, type IncomingOrder } from '@/features/quotes/utils/estimate'
import { computeQuoteTotals, DEFAULT_TAX_LINES, LABOR_LINE_NAME, CABLES_LINE_NAME, type TaxLine } from '@/features/quotes/utils/taxes'
import {
  DEFAULT_INTRO_MESSAGE,
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_DELIVERY_TIME_TEXT,
  DEFAULT_VALIDITY_TEXT,
  DEFAULT_NOTES,
} from '@/features/quotes/constants'

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

const versionSchema = z.object({
  // Opcionales: el modal simple de edicion no permite cambiar cliente/tipo de
  // proyecto, solo el flujo completo (carrito) los envia.
  client_id: z.string().trim().optional(),
  project_type: z.string().trim().optional(),
  discount_percent: z.coerce.number().min(0, 'El descuento no puede ser negativo').max(100, 'El descuento no puede superar 100%'),
  items: z.array(itemSchema).min(1, 'Agrega al menos un producto'),
  taxes: z.array(taxLineSchema).optional(),
  labor_enabled: z.string().optional().transform((v) => v === 'true'),
  labor_percent: z.coerce.number().min(0, 'La mano de obra no puede ser negativa').max(100, 'La mano de obra no puede superar 100%').default(0),
  cables_enabled: z.string().optional().transform((v) => v === 'true'),
  cables_percent: z.coerce.number().min(0, 'Cables y accesorios no puede ser negativo').max(100, 'Cables y accesorios no puede superar 100%').default(0),
  // Opcionales: si el caller no los envia (ej. el modal simple de edicion,
  // que no tiene campos para esto), se conservan los de la version anterior
  // en vez de perderlos silenciosamente.
  intro_message: z.string().trim().optional(),
  payment_terms: z.string().trim().optional(),
  delivery_time_text: z.string().trim().optional(),
  validity_text: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})

export async function createQuoteVersion(quoteId: string, formData: FormData) {
  const profile = await getCurrentProfile()
  if (!profile) {
    return { error: 'No autenticado' }
  }

  let rawItems: unknown
  let rawTaxes: unknown
  try {
    rawItems = JSON.parse((formData.get('items') as string) ?? '[]')
    rawTaxes = formData.get('taxes') ? JSON.parse(formData.get('taxes') as string) : undefined
  } catch {
    return { error: 'Items inválidos' }
  }

  const parsed = versionSchema.safeParse({
    client_id: formData.get('client_id') || undefined,
    project_type: formData.get('project_type') || undefined,
    discount_percent: formData.get('discount_percent') || '0',
    items: rawItems,
    taxes: rawTaxes,
    labor_enabled: formData.get('labor_enabled') || undefined,
    labor_percent: formData.get('labor_percent') || '0',
    cables_enabled: formData.get('cables_enabled') || undefined,
    cables_percent: formData.get('cables_percent') || '0',
    intro_message: formData.get('intro_message') || undefined,
    payment_terms: formData.get('payment_terms') || undefined,
    delivery_time_text: formData.get('delivery_time_text') || undefined,
    validity_text: formData.get('validity_text') || undefined,
    notes: formData.has('notes') ? formData.get('notes') : undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  const { data: quote } = await supabase.from('quotes').select('id, commercial_id').eq('id', quoteId).single()
  const isOwner = quote?.commercial_id === profile.id
  if (!quote || (!isOwner && profile.role !== 'gerente')) {
    return { error: 'No tienes permiso para editar esta cotización' }
  }

  const productIds = [...new Set(parsed.data.items.map((item) => item.product_id))]

  const [{ data: availabilityRows }, { data: productsRows }, { data: poItemsRows }, { data: discountRule }, { data: lastVersion }] =
    await Promise.all([
      supabase.from('inventory_availability').select('product_id, available_with_quotes').in('product_id', productIds),
      supabase.from('products').select('id, unit_price').in('id', productIds),
      supabase.from('purchase_order_items').select('product_id, quantity, purchase_order_id').in('product_id', productIds),
      supabase.from('discount_rules').select('max_discount_percent').eq('role', profile.role).single(),
      supabase
        .from('quote_versions')
        .select('version_number, intro_message, payment_terms, delivery_time_text, validity_text, notes')
        .eq('quote_id', quoteId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single(),
    ])

  const poIds = [...new Set((poItemsRows ?? []).map((row) => row.purchase_order_id))]
  const { data: posRows } = poIds.length
    ? await supabase.from('purchase_orders').select('id, expected_arrival_date, status').in('id', poIds).in('status', ['pending', 'partial'])
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
  // mismo producto compiten por el mismo stock (igual que en createQuote).
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

  const maxDiscount = discountRule?.max_discount_percent ?? 0
  const requiresApproval = parsed.data.discount_percent > maxDiscount
  const taxLines: TaxLine[] = parsed.data.taxes ?? DEFAULT_TAX_LINES
  const totals = computeQuoteTotals({
    subtotal: estimate.subtotal,
    discountPercent: parsed.data.discount_percent,
    laborEnabled: parsed.data.labor_enabled,
    laborPercent: parsed.data.labor_percent,
    cablesEnabled: parsed.data.cables_enabled,
    cablesPercent: parsed.data.cables_percent,
    taxLines,
  })
  const total = totals.total
  const nextVersionNumber = (lastVersion?.version_number ?? 0) + 1

  const { data: version, error: versionError } = await supabase
    .from('quote_versions')
    .insert({
      quote_id: quoteId,
      version_number: nextVersionNumber,
      subtotal: estimate.subtotal,
      discount_percent: parsed.data.discount_percent,
      total,
      estimated_delivery_date: estimate.estimatedDeliveryDate,
      requires_approval: requiresApproval,
      intro_message: parsed.data.intro_message ?? lastVersion?.intro_message ?? DEFAULT_INTRO_MESSAGE,
      payment_terms: parsed.data.payment_terms ?? lastVersion?.payment_terms ?? DEFAULT_PAYMENT_TERMS,
      delivery_time_text: parsed.data.delivery_time_text ?? lastVersion?.delivery_time_text ?? DEFAULT_DELIVERY_TIME_TEXT,
      validity_text: parsed.data.validity_text ?? lastVersion?.validity_text ?? DEFAULT_VALIDITY_TEXT,
      notes: parsed.data.notes ?? lastVersion?.notes ?? DEFAULT_NOTES,
      created_by: profile.id,
    })
    .select('id')
    .single()

  if (versionError || !version) {
    return { error: versionError?.message ?? 'No se pudo crear la nueva versión' }
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
    {
      quote_version_id: version.id,
      name: CABLES_LINE_NAME,
      rate: parsed.data.cables_percent,
      kind: 'add',
      enabled: parsed.data.cables_enabled,
      amount: totals.cablesAmount,
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

  const { error: quoteUpdateError } = await supabase
    .from('quotes')
    .update({
      current_version_id: version.id,
      status: requiresApproval ? 'pending_approval' : 'draft',
      ...(parsed.data.client_id ? { client_id: parsed.data.client_id } : {}),
      ...(parsed.data.project_type ? { project_type: parsed.data.project_type } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', quoteId)

  if (quoteUpdateError) {
    return { error: quoteUpdateError.message }
  }

  revalidatePath(`/quotes/${quoteId}`)
  revalidatePath('/quotes')
  return { success: true, requiresApproval }
}

export async function approveQuoteVersion(quoteVersionId: string, quoteId: string) {
  const profile = await getCurrentProfile()
  if (!profile || profile.role !== 'gerente') {
    return { error: 'No tienes permiso para aprobar descuentos' }
  }

  const supabase = await createClient()

  const { error: versionError } = await supabase
    .from('quote_versions')
    .update({ approved_by: profile.id, approved_at: new Date().toISOString() })
    .eq('id', quoteVersionId)

  if (versionError) {
    return { error: versionError.message }
  }

  const { error: quoteError } = await supabase
    .from('quotes')
    .update({ status: 'draft', updated_at: new Date().toISOString() })
    .eq('id', quoteId)

  if (quoteError) {
    return { error: quoteError.message }
  }

  revalidatePath(`/quotes/${quoteId}`)
  revalidatePath('/quotes')
  return { success: true }
}
