'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'

const itemSchema = z.object({
  product_id: z.string().trim().min(1, 'Selecciona un producto'),
  quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
  unit_cost: z.coerce.number().nonnegative().optional(),
})

const purchaseOrderSchema = z.object({
  supplier_id: z.string().trim().min(1, 'Selecciona un proveedor'),
  expected_arrival_date: z.string().trim().min(1, 'La fecha estimada es requerida'),
  items: z.array(itemSchema).min(1, 'Agrega al menos un producto'),
})

export async function createPurchaseOrder(formData: FormData) {
  const profile = await getCurrentProfile()
  if (!profile || !hasRole(profile, 'compras')) {
    return { error: 'No tienes permiso para crear órdenes de compra' }
  }

  let items: unknown
  try {
    items = JSON.parse((formData.get('items') as string) ?? '[]')
  } catch {
    return { error: 'Items inválidos' }
  }

  const parsed = purchaseOrderSchema.safeParse({
    supplier_id: formData.get('supplier_id'),
    expected_arrival_date: formData.get('expected_arrival_date'),
    items,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { data: purchaseOrder, error } = await supabase
    .from('purchase_orders')
    .insert({
      supplier_id: parsed.data.supplier_id,
      expected_arrival_date: parsed.data.expected_arrival_date,
      created_by: profile.id,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  const { error: itemsError } = await supabase.from('purchase_order_items').insert(
    parsed.data.items.map((item) => ({
      purchase_order_id: purchaseOrder.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost ?? null,
    }))
  )

  if (itemsError) {
    return { error: itemsError.message }
  }

  revalidatePath('/purchase-orders')
  return { success: true }
}

export async function receivePurchaseOrder(purchaseOrderId: string) {
  const profile = await getCurrentProfile()
  if (!profile || !hasRole(profile, 'compras')) {
    return { error: 'No tienes permiso para recibir órdenes de compra' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('receive_purchase_order', {
    p_purchase_order_id: purchaseOrderId,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/purchase-orders')
  revalidatePath('/products')
  return { success: true }
}

export async function cancelPurchaseOrder(purchaseOrderId: string) {
  const profile = await getCurrentProfile()
  if (!profile || !hasRole(profile, 'compras')) {
    return { error: 'No tienes permiso para cancelar órdenes de compra' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('purchase_orders')
    .update({ status: 'cancelled' })
    .eq('id', purchaseOrderId)
    .not('status', 'in', '(received,cancelled)')

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/purchase-orders')
  return { success: true }
}
