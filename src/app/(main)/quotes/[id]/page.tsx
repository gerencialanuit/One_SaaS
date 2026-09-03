import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/profile'
import { QuoteDetailClient } from '@/features/quotes/components/QuoteDetailClient'
import type { QuoteDetailData, QuoteItemWithProduct } from '@/features/quotes/types'
import type { QuoteVersion } from '@/types/database'
import type { IncomingOrder } from '@/features/quotes/utils/estimate'

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, client:clients(*), commercial:profiles(full_name, email)')
    .eq('id', id)
    .single()

  if (!quote) {
    notFound()
  }

  const { data: versions } = await supabase
    .from('quote_versions')
    .select('*')
    .eq('quote_id', id)
    .order('version_number', { ascending: false })

  const currentVersion = (versions ?? []).find((v) => v.id === quote.current_version_id) ?? null

  const [{ data: currentItemsRaw }, { data: currentTaxes }] = currentVersion
    ? await Promise.all([
        supabase.from('quote_items').select('*, product:products(id, name, sku)').eq('quote_version_id', currentVersion.id),
        supabase.from('quote_taxes').select('*').eq('quote_version_id', currentVersion.id),
      ])
    : [{ data: [] }, { data: [] }]

  const [{ data: products }, { data: availability }, { data: poItems }, { data: discountRule }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, description, sku, category:categories(name, parent:parent_id(name)), brand:brands(name), line, condition, supply_model, image_url, reference_url, unit_price')
      .eq('is_active', true)
      .neq('condition', 'averiado')
      .order('name'),
    supabase.from('inventory_availability').select('product_id, available_with_quotes'),
    supabase.from('purchase_order_items').select('product_id, quantity, purchase_order_id'),
    profile
      ? supabase.from('discount_rules').select('max_discount_percent').eq('role', profile.role).single()
      : Promise.resolve({ data: null }),
  ])

  const availabilityMap = new Map((availability ?? []).map((a) => [a.product_id, a.available_with_quotes]))
  const productOptions = (products ?? []).map((p) => {
    const category = p.category as unknown as { name: string; parent: { name: string } | null } | null
    return {
      ...p,
      category: category?.parent?.name ?? category?.name ?? '',
      subcategory: category?.parent ? category.name : null,
      brand: (p.brand as unknown as { name: string } | null)?.name ?? null,
      available_with_quotes: availabilityMap.get(p.id) ?? 0,
    }
  })

  const poIds = [...new Set((poItems ?? []).map((row) => row.purchase_order_id))]
  const { data: purchaseOrders } = poIds.length
    ? await supabase.from('purchase_orders').select('id, expected_arrival_date, status').in('id', poIds).in('status', ['pending', 'partial'])
    : { data: [] }

  const poMap = new Map((purchaseOrders ?? []).map((po) => [po.id, po]))
  const incomingOrders: IncomingOrder[] = (poItems ?? [])
    .map((row) => {
      const po = poMap.get(row.purchase_order_id)
      if (!po) return null
      return { productId: row.product_id, expectedArrivalDate: po.expected_arrival_date, quantity: row.quantity }
    })
    .filter((x): x is IncomingOrder => x !== null)

  const quoteDetail: QuoteDetailData = {
    ...quote,
    versions: (versions ?? []) as QuoteVersion[],
    currentItems: (currentItemsRaw ?? []) as QuoteItemWithProduct[],
    currentTaxes: currentTaxes ?? [],
  }

  const canEdit = profile?.role === 'gerente' || (profile?.role === 'comercial' && profile.id === quote.commercial_id)
  const canApprove = profile?.role === 'gerente' && !!currentVersion?.requires_approval && !currentVersion.approved_by

  return (
    <QuoteDetailClient
      quote={quoteDetail}
      currentVersion={currentVersion}
      products={productOptions}
      incomingOrders={incomingOrders}
      canEdit={canEdit}
      canApprove={canApprove}
      maxDiscountPercent={discountRule?.max_discount_percent ?? 0}
    />
  )
}
