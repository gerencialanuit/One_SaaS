'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/profile'

export async function toggleFavoriteProduct(productId: string, makeFavorite: boolean) {
  const profile = await getCurrentProfile()
  if (!profile) {
    return { error: 'No autenticado' }
  }

  const supabase = await createClient()

  if (makeFavorite) {
    const { error } = await supabase
      .from('product_favorites')
      .insert({ profile_id: profile.id, product_id: productId })
    if (error && error.code !== '23505') {
      return { error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('product_favorites')
      .delete()
      .eq('profile_id', profile.id)
      .eq('product_id', productId)
    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/quotes/new')
  return { success: true }
}
