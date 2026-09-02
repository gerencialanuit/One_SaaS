'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'
import { setProductAttributeValues } from './attributes'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

const productSchema = z.object({
  sku: z.string().trim().optional(),
  name: z.string().trim().min(1, 'El nombre es requerido'),
  description: z.string().trim().optional(),
  category_id: z.string().trim().min(1, 'La categoría es requerida'),
  brand_id: z.string().trim().optional(),
  line: z.string().trim().optional(),
  supplier_id: z.string().trim().optional(),
  unit_price: z.coerce.number().positive('El precio debe ser mayor a 0'),
  unit_cost: z.coerce.number().nonnegative('El costo no puede ser negativo').optional(),
  currency: z.string().trim().min(1).default('COP'),
  condition: z.enum(['nuevo', 'usado', 'averiado']).default('nuevo'),
  supply_model: z.enum(['inventario', 'bajo_pedido']).default('inventario'),
  low_stock_threshold: z.coerce.number().int().nonnegative('El umbral no puede ser negativo'),
  reference_url: z.string().trim().url('La URL no es válida').optional(),
})

function parseProductForm(formData: FormData) {
  const supplyModel = formData.get('supply_model') || 'inventario'
  return productSchema.safeParse({
    sku: formData.get('sku') || undefined,
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    category_id: formData.get('category_id'),
    brand_id: formData.get('brand_id') || undefined,
    line: formData.get('line') || undefined,
    supplier_id: formData.get('supplier_id') || undefined,
    unit_price: formData.get('unit_price'),
    unit_cost: formData.get('unit_cost') || undefined,
    currency: formData.get('currency') || 'COP',
    condition: formData.get('condition') || 'nuevo',
    supply_model: supplyModel,
    low_stock_threshold: formData.get('low_stock_threshold') || (supplyModel === 'bajo_pedido' ? '0' : '5'),
    reference_url: formData.get('reference_url') || undefined,
  })
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

async function uploadImageFile(
  supabase: SupabaseServerClient,
  file: File
): Promise<{ url: string | null; error: string | null }> {
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

async function uploadProductImage(
  supabase: SupabaseServerClient,
  formData: FormData
): Promise<{ url: string | null; error: string | null }> {
  const file = formData.get('image')
  if (!(file instanceof File) || file.size === 0) {
    return { url: null, error: null }
  }
  return uploadImageFile(supabase, file)
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
      description: parsed.data.description || null,
      category_id: parsed.data.category_id,
      brand_id: parsed.data.brand_id || null,
      line: parsed.data.line || null,
      supplier_id: parsed.data.supplier_id || null,
      unit_price: parsed.data.unit_price,
      unit_cost: parsed.data.unit_cost ?? null,
      currency: parsed.data.currency,
      condition: parsed.data.condition,
      supply_model: parsed.data.supply_model,
      low_stock_threshold: parsed.data.low_stock_threshold,
      image_url: imageUrl,
      reference_url: parsed.data.reference_url || null,
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

  const { error: attributesError } = await setProductAttributeValues(product.id, formData)
  if (attributesError) {
    return { error: attributesError }
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
      description: parsed.data.description || null,
      category_id: parsed.data.category_id,
      brand_id: parsed.data.brand_id || null,
      line: parsed.data.line || null,
      supplier_id: parsed.data.supplier_id || null,
      unit_price: parsed.data.unit_price,
      unit_cost: parsed.data.unit_cost ?? null,
      currency: parsed.data.currency,
      condition: parsed.data.condition,
      supply_model: parsed.data.supply_model,
      low_stock_threshold: parsed.data.low_stock_threshold,
      reference_url: parsed.data.reference_url || null,
      ...(imageUrl ? { image_url: imageUrl } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)

  if (error) {
    return { error: error.message }
  }

  const { error: attributesError } = await setProductAttributeValues(productId, formData)
  if (attributesError) {
    return { error: attributesError }
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

export interface BulkProductChanges {
  category_id?: string
  brand_id?: string | null
  supplier_id?: string | null
  is_active?: boolean
}

export async function bulkUpdateProducts(productIds: string[], changes: BulkProductChanges) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, 'inventarios')) {
    return { error: 'No tienes permiso para editar productos' }
  }
  if (productIds.length === 0) {
    return { error: 'No hay productos seleccionados' }
  }

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (changes.category_id) payload.category_id = changes.category_id
  if (changes.brand_id !== undefined) payload.brand_id = changes.brand_id
  if (changes.supplier_id !== undefined) payload.supplier_id = changes.supplier_id
  if (changes.is_active !== undefined) payload.is_active = changes.is_active

  const supabase = await createClient()
  const { error } = await supabase.from('products').update(payload).in('id', productIds)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/products')
  return { success: true }
}

export interface ImportProductRow {
  sku: string
  name: string
  description: string
  category: string
  subcategory: string
  brand: string
  line: string
  condition: string
  supply_model: string
  currency: string
  unit_price: string
  unit_cost: string
  low_stock_threshold: string
  is_active: string
  reference_url: string
}

export interface ImportProductsResult {
  created: number
  updated: number
  failed: number
  errors: string[]
}

function baseFilename(name: string): string {
  return name.replace(/\.[^./\\]+$/, '').trim().toLowerCase()
}

export async function importProducts(formData: FormData): Promise<{ error: string } | ({ success: true } & ImportProductsResult)> {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, 'inventarios')) {
    return { error: 'No tienes permiso para importar productos' }
  }

  let rows: ImportProductRow[]
  try {
    rows = JSON.parse((formData.get('rows') as string) ?? '[]')
  } catch {
    return { error: 'El archivo de filas no es válido' }
  }
  if (rows.length === 0) {
    return { error: 'El archivo no tiene filas para importar' }
  }

  const imagesBySku = new Map(
    formData
      .getAll('images')
      .filter((entry): entry is File => entry instanceof File)
      .map((file) => [baseFilename(file.name), file] as const)
  )

  const supabase = await createClient()

  const categoryNames = [...new Set(rows.map((r) => r.category?.trim()).filter((v): v is string => !!v))]
  const { data: existingCategories } = await supabase.from('categories').select('id, name').is('parent_id', null)
  const categoryMap = new Map((existingCategories ?? []).map((c) => [c.name.toLowerCase(), c.id]))

  const missingCategoryNames = categoryNames.filter((name) => !categoryMap.has(name.toLowerCase()))
  if (missingCategoryNames.length > 0) {
    const { data: createdCategories, error: categoryError } = await supabase
      .from('categories')
      .insert(missingCategoryNames.map((name) => ({ name })))
      .select('id, name')
    if (categoryError) {
      return { error: `No se pudieron crear las categorías nuevas: ${categoryError.message}` }
    }
    for (const c of createdCategories ?? []) {
      categoryMap.set(c.name.toLowerCase(), c.id)
    }
  }

  const brandNames = [...new Set(rows.map((r) => r.brand?.trim()).filter((v): v is string => !!v))]
  const { data: existingBrands } = await supabase.from('brands').select('id, name')
  const brandMap = new Map((existingBrands ?? []).map((b) => [b.name.toLowerCase(), b.id]))

  const missingBrandNames = brandNames.filter((name) => !brandMap.has(name.toLowerCase()))
  if (missingBrandNames.length > 0) {
    const { data: createdBrands, error: brandError } = await supabase
      .from('brands')
      .insert(missingBrandNames.map((name) => ({ name })))
      .select('id, name')
    if (brandError) {
      return { error: `No se pudieron crear las marcas nuevas: ${brandError.message}` }
    }
    for (const b of createdBrands ?? []) {
      brandMap.set(b.name.toLowerCase(), b.id)
    }
  }

  const subcategoryPairs = new Map<string, { rootId: string; name: string }>()
  for (const row of rows) {
    const rootId = categoryMap.get(row.category?.trim().toLowerCase() ?? '')
    const subName = row.subcategory?.trim()
    if (rootId && subName) {
      subcategoryPairs.set(`${rootId}::${subName.toLowerCase()}`, { rootId, name: subName })
    }
  }

  const subcategoryMap = new Map<string, string>()
  if (subcategoryPairs.size > 0) {
    const rootIds = [...new Set([...subcategoryPairs.values()].map((p) => p.rootId))]
    const { data: existingSubcategories } = await supabase
      .from('categories')
      .select('id, name, parent_id')
      .in('parent_id', rootIds)
    for (const c of existingSubcategories ?? []) {
      subcategoryMap.set(`${c.parent_id}::${c.name.toLowerCase()}`, c.id)
    }

    const missingSubcategories = [...subcategoryPairs.entries()].filter(([key]) => !subcategoryMap.has(key))
    if (missingSubcategories.length > 0) {
      const { data: createdSubcategories, error: subcategoryError } = await supabase
        .from('categories')
        .insert(missingSubcategories.map(([, p]) => ({ name: p.name, parent_id: p.rootId })))
        .select('id, name, parent_id')
      if (subcategoryError) {
        return { error: `No se pudieron crear las subcategorías nuevas: ${subcategoryError.message}` }
      }
      for (const c of createdSubcategories ?? []) {
        subcategoryMap.set(`${c.parent_id}::${c.name.toLowerCase()}`, c.id)
      }
    }
  }

  const skus = rows.map((r) => r.sku?.trim()).filter((v): v is string => !!v)
  const { data: existingProducts } = skus.length
    ? await supabase.from('products').select('id, sku').in('sku', skus)
    : { data: [] }
  const productIdBySku = new Map((existingProducts ?? []).filter((p) => p.sku).map((p) => [p.sku as string, p.id]))

  const result: ImportProductsResult = { created: 0, updated: 0, failed: 0, errors: [] }

  for (const row of rows) {
    const rowLabel = row.name?.trim() || row.sku?.trim() || 'fila sin nombre'
    const rootCategoryId = categoryMap.get(row.category?.trim().toLowerCase() ?? '')

    if (!rootCategoryId) {
      result.failed++
      result.errors.push(`${rowLabel}: falta la categoría`)
      continue
    }

    const subcategoryName = row.subcategory?.trim()
    const categoryId = subcategoryName
      ? (subcategoryMap.get(`${rootCategoryId}::${subcategoryName.toLowerCase()}`) ?? rootCategoryId)
      : rootCategoryId

    const unitPrice = Number(row.unit_price)
    if (!row.name?.trim() || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      result.failed++
      result.errors.push(`${rowLabel}: nombre o precio inválido`)
      continue
    }

    const condition = (['nuevo', 'usado', 'averiado'].includes(row.condition?.trim()) ? row.condition.trim() : 'nuevo') as
      | 'nuevo'
      | 'usado'
      | 'averiado'
    const supplyModel = (['inventario', 'bajo_pedido'].includes(row.supply_model?.trim()) ? row.supply_model.trim() : 'inventario') as
      | 'inventario'
      | 'bajo_pedido'
    const unitCost = row.unit_cost?.trim() ? Number(row.unit_cost) : null
    const lowStockThreshold = row.low_stock_threshold?.trim() ? Number(row.low_stock_threshold) : 5
    const isActive = row.is_active?.trim() ? ['true', '1', 'si', 'sí', 'activo'].includes(row.is_active.trim().toLowerCase()) : true

    let imageUrl: string | undefined
    const matchedImage = row.sku?.trim() ? imagesBySku.get(baseFilename(row.sku.trim())) : undefined
    if (matchedImage) {
      const { url, error: uploadError } = await uploadImageFile(supabase, matchedImage)
      if (uploadError) {
        result.errors.push(`${rowLabel}: no se pudo subir la foto (${uploadError})`)
      } else if (url) {
        imageUrl = url
      }
    }

    const payload: Record<string, unknown> = {
      sku: row.sku?.trim() || null,
      name: row.name.trim(),
      description: row.description?.trim() || null,
      category_id: categoryId,
      brand_id: row.brand?.trim() ? (brandMap.get(row.brand.trim().toLowerCase()) ?? null) : null,
      line: row.line?.trim() || null,
      condition,
      supply_model: supplyModel,
      currency: row.currency?.trim() || 'COP',
      unit_price: unitPrice,
      unit_cost: unitCost,
      low_stock_threshold: Number.isFinite(lowStockThreshold) ? lowStockThreshold : 5,
      is_active: isActive,
      reference_url: row.reference_url?.trim() || null,
    }

    if (imageUrl) {
      payload.image_url = imageUrl
    }

    const existingId = row.sku?.trim() ? productIdBySku.get(row.sku.trim()) : undefined

    if (existingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', existingId)
      if (error) {
        result.failed++
        result.errors.push(`${rowLabel}: ${error.message}`)
      } else {
        result.updated++
      }
    } else {
      const { data: newProduct, error } = await supabase.from('products').insert(payload).select('id').single()
      if (error || !newProduct) {
        result.failed++
        result.errors.push(`${rowLabel}: ${error?.message ?? 'no se pudo crear'}`)
      } else {
        await supabase.from('inventory').insert({ product_id: newProduct.id, quantity_on_hand: 0 })
        result.created++
      }
    }
  }

  revalidatePath('/products')
  return { success: true, ...result }
}
