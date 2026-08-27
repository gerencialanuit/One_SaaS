'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

const productSchema = z.object({
  sku: z.string().trim().optional(),
  name: z.string().trim().min(1, 'El nombre es requerido'),
  category: z.string().trim().min(1, 'La categoría es requerida'),
  brand: z.string().trim().optional(),
  supplier_id: z.string().trim().optional(),
  unit_price: z.coerce.number().positive('El precio debe ser mayor a 0'),
  unit_cost: z.coerce.number().nonnegative('El costo no puede ser negativo').optional(),
  currency: z.string().trim().min(1).default('COP'),
  condition: z.enum(['nuevo', 'usado', 'averiado']).default('nuevo'),
  supply_model: z.enum(['inventario', 'bajo_pedido']).default('inventario'),
  low_stock_threshold: z.coerce.number().int().nonnegative('El umbral no puede ser negativo'),
})

function parseProductForm(formData: FormData) {
  const supplyModel = formData.get('supply_model') || 'inventario'
  return productSchema.safeParse({
    sku: formData.get('sku') || undefined,
    name: formData.get('name'),
    category: formData.get('category'),
    brand: formData.get('brand') || undefined,
    supplier_id: formData.get('supplier_id') || undefined,
    unit_price: formData.get('unit_price'),
    unit_cost: formData.get('unit_cost') || undefined,
    currency: formData.get('currency') || 'COP',
    condition: formData.get('condition') || 'nuevo',
    supply_model: supplyModel,
    low_stock_threshold: formData.get('low_stock_threshold') || (supplyModel === 'bajo_pedido' ? '0' : '5'),
  })
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

async function uploadProductImage(
  supabase: SupabaseServerClient,
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const file = formData.get('image')
  if (!(file instanceof File) || file.size === 0) {
    return { url: null, error: null }
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { url: null, error: 'La imagen debe ser PNG, JPG o WEBP' }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { url: null, error: 'La imagen no puede superar 5MB' }
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('product-images').upload(path, file, {
    contentType: file.type,
  })

  if (error) {
    return { url: null, error: error.message }
  }

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

export async function createProduct(formData: FormData) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, 'inventarios')) {
    return { error: 'No tienes permiso para crear productos' }
  }

  const parsed = parseProductForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  const { url: imageUrl, error: imageError } = await uploadProductImage(supabase, formData)
  if (imageError) {
    return { error: imageError }
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      sku: parsed.data.sku || null,
      name: parsed.data.name,
      category: parsed.data.category,
      brand: parsed.data.brand || null,
      supplier_id: parsed.data.supplier_id || null,
      unit_price: parsed.data.unit_price,
      unit_cost: parsed.data.unit_cost ?? null,
      currency: parsed.data.currency,
      condition: parsed.data.condition,
      supply_model: parsed.data.supply_model,
      low_stock_threshold: parsed.data.low_stock_threshold,
      image_url: imageUrl,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  const { error: inventoryError } = await supabase
    .from('inventory')
    .insert({ product_id: product.id, quantity_on_hand: 0 })

  if (inventoryError) {
    return { error: inventoryError.message }
  }

  revalidatePath('/products')
  return { success: true }
}

export async function updateProduct(productId: string, formData: FormData) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, 'inventarios')) {
    return { error: 'No tienes permiso para editar productos' }
  }

  const parsed = parseProductForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  const { url: imageUrl, error: imageError } = await uploadProductImage(supabase, formData)
  if (imageError) {
    return { error: imageError }
  }

  const { error } = await supabase
    .from('products')
    .update({
      sku: parsed.data.sku || null,
      name: parsed.data.name,
      category: parsed.data.category,
      brand: parsed.data.brand || null,
      supplier_id: parsed.data.supplier_id || null,
      unit_price: parsed.data.unit_price,
      unit_cost: parsed.data.unit_cost ?? null,
      currency: parsed.data.currency,
      condition: parsed.data.condition,
      supply_model: parsed.data.supply_model,
      low_stock_threshold: parsed.data.low_stock_threshold,
      ...(imageUrl ? { image_url: imageUrl } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/products')
  return { success: true }
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, 'inventarios')) {
    return { error: 'No tienes permiso para modificar productos' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', productId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/products')
  return { success: true }
}
