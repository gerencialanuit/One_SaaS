import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'
import { ProductsPageClient } from '@/features/products/components/ProductsPageClient'
import type { ProductWithAvailability, ProductOpenPoSummary } from '@/features/products/types'

interface RawOpenPoItem {
  product_id: string
  quantity: number
  purchase_order: {
    id: string
    expected_arrival_date: string
    status: string
    supplier: { name: string } | null
  } | null
}

export default async function ProductsPage() {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  const [{ data: products }, { data: availability }, { data: suppliers }, { data: poItemsRaw }] = await Promise.all([
    supabase.from('products').select('*').order('name'),
    supabase.from('inventory_availability').select('*'),
    supabase.from('suppliers').select('id, name').order('name'),
    supabase
      .from('purchase_order_items')
      .select('product_id, quantity, purchase_order:purchase_orders(id, expected_arrival_date, status, supplier:suppliers(name))'),
  ])

  const availabilityMap = new Map((availability ?? []).map((a) => [a.product_id, a]))

  const productsWithAvailability: ProductWithAvailability[] = (products ?? []).map((product) => ({
    ...product,
    availability: availabilityMap.get(product.id) ?? null,
  }))

  const openPurchaseOrders: Record<string, ProductOpenPoSummary> = {}
  for (const item of (poItemsRaw ?? []) as unknown as RawOpenPoItem[]) {
    const po = item.purchase_order
    if (!po || (po.status !== 'pending' && po.status !== 'partial')) continue

    const summary = openPurchaseOrders[item.product_id] ?? { totalQuantity: 0, nearestDate: null, lines: [] }
    summary.totalQuantity += item.quantity
    summary.nearestDate = !summary.nearestDate || po.expected_arrival_date < summary.nearestDate
      ? po.expected_arrival_date
      : summary.nearestDate
    summary.lines.push({
      purchaseOrderId: po.id,
      expectedArrivalDate: po.expected_arrival_date,
      quantity: item.quantity,
      supplierName: po.supplier?.name ?? '—',
    })
    openPurchaseOrders[item.product_id] = summary
  }

  return (
    <ProductsPageClient
      products={productsWithAvailability}
      suppliers={suppliers ?? []}
      canManage={hasRole(profile, 'inventarios')}
      openPurchaseOrders={openPurchaseOrders}
    />
  )
}
