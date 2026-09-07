'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'

const profileSchema = z.object({
  full_name: z.string().trim().min(1, 'El nombre es requerido'),
  cargo: z.string().trim().optional(),
  commercial_email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  role: z.enum(['comercial', 'inventarios', 'compras', 'gerente']).optional(),
})

export async function updateProfile(profileId: string, formData: FormData) {
  const profile = await getCurrentProfile()
  if (!profile || !hasRole(profile, 'gerente')) {
    return { error: 'No tienes permiso para editar usuarios' }
  }

  const parsed = profileSchema.safeParse({
    full_name: formData.get('full_name'),
    cargo: formData.get('cargo') || undefined,
    commercial_email: formData.get('commercial_email') || undefined,
    role: formData.get('role') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  // Nunca permitir que el gerente se quite su propio rol por accidente desde
  // este formulario: se quedaria sin acceso a /users y al resto de permisos
  // de administrador en el acto.
  if (parsed.data.role && profileId === profile.id && parsed.data.role !== profile.role) {
    return { error: 'No puedes cambiar tu propio rol' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.full_name,
      cargo: parsed.data.cargo || null,
      commercial_email: parsed.data.commercial_email || null,
      ...(parsed.data.role ? { role: parsed.data.role } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/users')
  return { success: true }
}
