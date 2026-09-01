'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'

const attributeSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
})

export async function createAttribute(formData: FormData) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, 'inventarios')) {
    return { error: 'No tienes permiso para crear atributos' }
  }

  const parsed = attributeSchema.safeParse({ name: formData.get('name') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('product_attributes').insert({ name: parsed.data.name })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya existe un atributo con ese nombre' }
    }
    return { error: error.message }
  }

  revalidatePath('/products')
  return { success: true }
}

export async function deleteAttribute(attributeId: string) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, 'inventarios')) {
    return { error: 'No tienes permiso para eliminar atributos' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('product_attributes').delete().eq('id', attributeId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/products')
  return { success: true }
}

const valueEntrySchema = z.object({
  attribute_id: z.string().trim().min(1),
  value: z.string().trim(),
})

export async function setProductAttributeValues(productId: string, formData: FormData) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, 'inventarios')) {
    return { error: 'No tienes permiso para editar atributos del producto' }
  }

  let rawValues: unknown
  try {
    rawValues = JSON.parse((formData.get('attribute_values') as string) ?? '[]')
  } catch {
    return { error: 'Valores de atributos inválidos' }
  }

  const parsed = z.array(valueEntrySchema).safeParse(rawValues)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  const { error: deleteError } = await supabase.from('product_attribute_values').delete().eq('product_id', productId)
  if (deleteError) {
    return { error: deleteError.message }
  }

  const nonEmpty = parsed.data.filter((entry) => entry.value.length > 0)
  if (nonEmpty.length > 0) {
    const { error: insertError } = await supabase.from('product_attribute_values').insert(
      nonEmpty.map((entry) => ({
        product_id: productId,
        attribute_id: entry.attribute_id,
        value: entry.value,
      }))
    )
    if (insertError) {
      return { error: insertError.message }
    }
  }

  revalidatePath('/products')
  return { success: true }
}
