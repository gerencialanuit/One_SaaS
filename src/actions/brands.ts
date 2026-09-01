'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'

const brandSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
})

export async function createBrand(formData: FormData) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, 'inventarios')) {
    return { error: 'No tienes permiso para crear marcas' }
  }

  const parsed = brandSchema.safeParse({ name: formData.get('name') })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('brands').insert({ name: parsed.data.name })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya existe una marca con ese nombre' }
    }
    return { error: error.message }
  }

  revalidatePath('/products')
  return { success: true }
}

export async function deleteBrand(brandId: string) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, 'inventarios')) {
    return { error: 'No tienes permiso para eliminar marcas' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('brands').delete().eq('id', brandId)

  if (error) {
    if (error.code === '23503') {
      return { error: 'No puedes eliminar una marca que tiene productos asignados' }
    }
    return { error: error.message }
  }

  revalidatePath('/products')
  return { success: true }
}
