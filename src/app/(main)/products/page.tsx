import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'
import { ProductsPageClient } from '@/features/products/components/ProductsPageClient'
import type { ProductWithAvailability } from '@/features/products/types'

export default async function ProductsPage() {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  const [{ data: products }, { data: availability }, { data: suppliers }] = await Promise.all([
    supabase.from('products').select('*').order('name'),
    supabase.from('inventory_availability').select('*'),
    supabase.from('suppliers').select('id, name').order('name'),
  ])

  const availabilityMap = new Map((availability ?? []).map((a) => [a.product_id, a]))

  const productsWithAvailability: ProductWithAvailability[] = (products ?? []).map((product) => ({
    ...product,
    availability: availabilityMap.get(product.id) ?? null,
  }))

  return (
    <ProductsPageClient
      products={productsWithAvailability}
      suppliers={suppliers ?? []}
      canManage={hasRole(profile, 'inventarios')}
    />
  )
}
