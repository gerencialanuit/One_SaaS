import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'
import { PurchaseOrdersPageClient } from '@/features/purchase-orders/components/PurchaseOrdersPageClient'
import type { PurchaseOrderWithDetails } from '@/features/purchase-orders/types'

export default async function PurchaseOrdersPage() {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  const [{ data: purchaseOrders }, { data: suppliers }, { data: products }] = await Promise.all([
    supabase
      .from('purchase_orders')
      .select('*, supplier:suppliers(*), items:purchase_order_items(*, product:products(id, name, sku))')
      .order('created_at', { ascending: false }),
    supabase.from('suppliers').select('*').order('name'),
    supabase.from('products').select('id, name, sku').eq('is_active', true).order('name'),
  ])

  return (
    <PurchaseOrdersPageClient
      purchaseOrders={(purchaseOrders as PurchaseOrderWithDetails[] | null) ?? []}
      suppliers={suppliers ?? []}
      products={products ?? []}
      canManage={hasRole(profile, 'compras')}
    />
  )
}
