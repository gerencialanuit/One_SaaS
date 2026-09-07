'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/profile'

const clientSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  whatsapp: z.string().trim().optional(),
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  address: z.string().trim().min(1, 'La dirección es requerida'),
  city: z.string().trim().min(1, 'La ciudad es requerida'),
  client_type: z.enum(['constructora', 'cliente_final', 'estudio_diseno', 'arquitecto', 'administracion_ph', 'distribuidor', 'otro']),
})

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get('name'),
    whatsapp: formData.get('whatsapp') || undefined,
    email: formData.get('email') || undefined,
    address: formData.get('address'),
    city: formData.get('city'),
    client_type: formData.get('client_type') || 'cliente_final',
  })
}

async function findDuplicateClientName(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  name: string,
  excludeId?: string
) {
  const { data } = await supabase.from('clients').select('id, name')
  const target = name.trim().toLowerCase()
  return (data ?? []).some((c) => c.id !== excludeId && c.name.trim().toLowerCase() === target)
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

  if (await findDuplicateClientName(supabase, parsed.data.name)) {
    return { error: 'Ya existe un cliente con este nombre' }
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: parsed.data.name,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      city: parsed.data.city || null,
      client_type: parsed.data.client_type,
      created_by: profile.id,
    })
    .select('id, name')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'No se pudo crear el cliente' }
  }

  revalidatePath('/clients')
  return { success: true, client: data }
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

  if (await findDuplicateClientName(supabase, parsed.data.name, clientId)) {
    return { error: 'Ya existe un cliente con este nombre' }
  }

  const { error } = await supabase
    .from('clients')
    .update({
      name: parsed.data.name,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      city: parsed.data.city || null,
      client_type: parsed.data.client_type,
    })
    .eq('id', clientId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/clients')
  return { success: true }
}

export async function deleteClient(clientId: string) {
  const profile = await getCurrentProfile()
  if (!profile) {
    return { error: 'No autenticado' }
  }

  const supabase = await createSupabaseClient()
  const { data, error } = await supabase.from('clients').delete().eq('id', clientId).select('id')

  if (error) {
    if (error.code === '23503') {
      return { error: 'No se puede eliminar: este cliente tiene cotizaciones asociadas.' }
    }
    return { error: error.message }
  }

  if (!data || data.length === 0) {
    return { error: 'No tienes permiso para eliminar este cliente.' }
  }

  revalidatePath('/clients')
  return { success: true }
}
