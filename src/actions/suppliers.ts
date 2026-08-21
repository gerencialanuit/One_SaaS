'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'

const supplierSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  contact_name: z.string().trim().optional(),
  contact_phone: z.string().trim().optional(),
  contact_email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
})

function parseSupplierForm(formData: FormData) {
  return supplierSchema.safeParse({
    name: formData.get('name'),
    contact_name: formData.get('contact_name') || undefined,
    contact_phone: formData.get('contact_phone') || undefined,
    contact_email: formData.get('contact_email') || undefined,
  })
}

export async function createSupplier(formData: FormData) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, 'compras')) {
    return { error: 'No tienes permiso para crear proveedores' }
  }

  const parsed = parseSupplierForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('suppliers').insert({
    name: parsed.data.name,
    contact_name: parsed.data.contact_name || null,
    contact_phone: parsed.data.contact_phone || null,
    contact_email: parsed.data.contact_email || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/purchase-orders')
  return { success: true }
}

export async function updateSupplier(supplierId: string, formData: FormData) {
  const profile = await getCurrentProfile()
  if (!hasRole(profile, 'compras')) {
    return { error: 'No tienes permiso para editar proveedores' }
  }

  const parsed = parseSupplierForm(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('suppliers')
    .update({
      name: parsed.data.name,
      contact_name: parsed.data.contact_name || null,
      contact_phone: parsed.data.contact_phone || null,
      contact_email: parsed.data.contact_email || null,
    })
    .eq('id', supplierId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/purchase-orders')
  return { success: true }
}
