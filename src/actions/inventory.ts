'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'

const quantitySchema = z.object({
  quantity_on_hand: z.coerce.number().int().nonnegative('La cantidad no puede ser negativa'),
})

export async function updateInventoryQuantity(productId: string, formData: FormData) {
  const profile = await getCurrentProfile()
  if (!profile || !hasRole(profile, 'inventarios')) {
    return { error: 'No tienes permiso para editar el inventario' }
  }

  const parsed = quantitySchema.safeParse({
    quantity_on_hand: formData.get('quantity_on_hand'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('inventory')
    .update({
      quantity_on_hand: parsed.data.quantity_on_hand,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq('product_id', productId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/products')
  return { success: true }
}
