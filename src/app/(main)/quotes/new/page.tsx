import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/profile'
import { QuoteBuilderForm } from '@/features/quotes/components/QuoteBuilderForm'
import { getTranslator } from '@/lib/i18n/server'
import type { IncomingOrder } from '@/features/quotes/utils/estimate'

export default async function NewQuotePage() {
  const supabase = await createClient()
  const profile = await getCurrentProfile()
  const { t } = await getTranslator()

  const [
    { data: clients },
    { data: products },
    { data: availability },
    { data: poItems },
    { data: favorites },
    { data: discountRule },
    { data: templates },
  ] = await Promise.all([
    supabase.from('clients').select('id, name').order('name'),
    supabase
      .from('products')
      .select('id, name, sku, category:categories(name), brand:brands(name), condition, supply_model, image_url, unit_price')
      .eq('is_active', true)
      .neq('condition', 'averiado')
      .order('name'),
    supabase.from('inventory_availability').select('product_id, available_with_quotes'),
    supabase.from('purchase_order_items').select('product_id, quantity, purchase_order_id'),
    profile
      ? supabase.from('product_favorites').select('product_id').eq('profile_id', profile.id)
      : Promise.resolve({ data: [] }),
    profile
      ? supabase.from('discount_rules').select('max_discount_percent').eq('role', profile.role).single()
      : Promise.resolve({ data: null }),
    profile
      ? supabase
          .from('quote_templates')
          .select('*, items:quote_template_items(*), creator:profiles(full_name, email)')
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const availabilityMap = new Map((availability ?? []).map((a) => [a.product_id, a.available_with_quotes]))
  const favoriteIds = new Set((favorites ?? []).map((f) => f.product_id))

  const productOptions = (products ?? []).map((p) => ({
    ...p,
    category: (p.category as unknown as { name: string } | null)?.name ?? '',
    brand: (p.brand as unknown as { name: string } | null)?.name ?? null,
    available_with_quotes: availabilityMap.get(p.id) ?? 0,
    is_favorite: favoriteIds.has(p.id),
  }))

  const poIds = [...new Set((poItems ?? []).map((row) => row.purchase_order_id))]
  const { data: purchaseOrders } = poIds.length
    ? await supabase
        .from('purchase_orders')
        .select('id, expected_arrival_date, status')
        .in('id', poIds)
        .in('status', ['pending', 'partial'])
    : { data: [] }

  const poMap = new Map((purchaseOrders ?? []).map((po) => [po.id, po]))
  const incomingOrders: IncomingOrder[] = (poItems ?? [])
    .map((row) => {
      const po = poMap.get(row.purchase_order_id)
      if (!po) return null
      return { productId: row.product_id, expectedArrivalDate: po.expected_arrival_date, quantity: row.quantity }
    })
    .filter((x): x is IncomingOrder => x !== null)

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl font-bold text-navy">{t('quoteNew.title')}</h1>
      <p className="mt-1 text-slate">{t('quoteNew.subtitle')}</p>

      <div className="mt-6">
        <QuoteBuilderForm
          clients={clients ?? []}
          products={productOptions}
          incomingOrders={incomingOrders}
          maxDiscountPercent={discountRule?.max_discount_percent ?? 0}
          templates={templates ?? []}
          currentProfileId={profile?.id ?? ''}
          isGerente={profile?.role === 'gerente'}
        />
      </div>
    </div>
  )
}
