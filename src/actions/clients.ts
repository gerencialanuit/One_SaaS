'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/profile'

const clientSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  whatsapp: z.string().trim().optional(),
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  address: z.string().trim().optional(),
  client_type: z.enum(['constructora', 'cliente_final', 'estudio_diseno', 'arquitecto', 'administracion_ph', 'distribuidor', 'otro']),
})

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get('name'),
    whatsapp: formData.get('whatsapp') || undefined,
    email: formData.get('email') || undefined,
    address: formData.get('address') || undefined,
    client_type: formData.get('client_type') || 'cliente_final',
  })
}

export async function createClient(formData: FormData) {
  const profile = await getCurrentProfile()
  if (!profile) {
    return { error: 'No autenticado' }
  }

  const parsed = parseClientForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createSupabaseClient()
  const { error } = await supabase.from('clients').insert({
    name: parsed.data.name,
    whatsapp: parsed.data.whatsapp || null,
    email: parsed.data.email || null,
    address: parsed.data.address || null,
    client_type: parsed.data.client_type,
    created_by: profile.id,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/clients')
  return { success: true }
}

export async function updateClient(clientId: string, formData: FormData) {
  const profile = await getCurrentProfile()
  if (!profile) {
    return { error: 'No autenticado' }
  }

  const parsed = parseClientForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createSupabaseClient()
  const { error } = await supabase
    .from('clients')
    .update({
      name: parsed.data.name,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      client_type: parsed.data.client_type,
    })
    .eq('id', clientId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/clients')
  return { success: true }
}
