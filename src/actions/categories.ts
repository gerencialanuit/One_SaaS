'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'

const categorySchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  parent_id: z.string().trim().optional(),
})

function parseCategoryForm(formData: FormData) {
  return categorySchema.safeParse({
    name: formData.get('name'),
    parent_id: formData.get('parent_id') || undefined,
  })
}

export async function createCategory(formData: FormData) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, 'inventarios')) {
    return { error: 'No tienes permiso para crear categorías' }
  }

  const parsed = parseCategoryForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('categories').insert({
    name: parsed.data.name,
    parent_id: parsed.data.parent_id || null,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya existe una categoría con ese nombre en el mismo nivel' }
    }
    return { error: error.message }
  }

  revalidatePath('/products')
  return { success: true }
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, 'inventarios')) {
    return { error: 'No tienes permiso para editar categorías' }
  }

  const parsed = parseCategoryForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  if (parsed.data.parent_id === categoryId) {
    return { error: 'Una categoría no puede ser su propia categoría padre' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('categories')
    .update({
      name: parsed.data.name,
      parent_id: parsed.data.parent_id || null,
    })
    .eq('id', categoryId)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya existe una categoría con ese nombre en el mismo nivel' }
    }
    return { error: error.message }
  }

  revalidatePath('/products')
  return { success: true }
}

export async function deleteCategory(categoryId: string) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, 'inventarios')) {
    return { error: 'No tienes permiso para eliminar categorías' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('categories').delete().eq('id', categoryId)

  if (error) {
    if (error.code === '23503') {
      return { error: 'No puedes eliminar una categoría que tiene productos asignados' }
    }
    return { error: error.message }
  }

  revalidatePath('/products')
  return { success: true }
}
