'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'

const itemSchema = z.object({
  product_id: z.string().trim().min(1),
  quantity: z.coerce.number().int().positive('La cantidad debe ser mayor a 0'),
  zone_name: z.string().trim().optional(),
})

const templateSchema = z.object({
  name: z.string().trim().min(1, 'El nombre de la plantilla es requerido'),
  is_shared: z.string().optional().transform((v) => v === 'true'),
  items: z.array(itemSchema).min(1, 'La plantilla necesita al menos un producto'),
})

export async function createQuoteTemplate(formData: FormData) {
  const profile = await getCurrentProfile()
  if (!profile || !hasRole(profile, 'comercial')) {
    return { error: 'No tienes permiso para crear plantillas' }
  }

  let rawItems: unknown
  try {
    rawItems = JSON.parse((formData.get('items') as string) ?? '[]')
  } catch {
    return { error: 'Items inválidos' }
  }

  const parsed = templateSchema.safeParse({
    name: formData.get('name'),
    is_shared: formData.get('is_shared') || undefined,
    items: rawItems,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const isShared = parsed.data.is_shared && profile.role === 'gerente'

  const supabase = await createClient()

  const { data: template, error: templateError } = await supabase
    .from('quote_templates')
    .insert({
      name: parsed.data.name,
      is_shared: isShared,
      created_by: profile.id,
    })
    .select('id')
    .single()

  if (templateError || !template) {
    return { error: templateError?.message ?? 'No se pudo crear la plantilla' }
  }

  const { error: itemsError } = await supabase.from('quote_template_items').insert(
    parsed.data.items.map((item) => ({
      template_id: template.id,
      product_id: item.product_id,
      quantity: item.quantity,
      zone_name: item.zone_name || null,
    }))
  )

  if (itemsError) {
    return { error: itemsError.message }
  }

  revalidatePath('/quotes/new')
  return { success: true, templateId: template.id }
}

export async function deleteQuoteTemplate(templateId: string) {
  const profile = await getCurrentProfile()
  if (!profile) {
    return { error: 'No autenticado' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('quote_templates').delete().eq('id', templateId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/quotes/new')
  return { success: true }
}
