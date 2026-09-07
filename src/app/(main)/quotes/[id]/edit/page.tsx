import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/profile'
import { QuoteBuilderForm, type QuoteBuilderEditInitial } from '@/features/quotes/components/QuoteBuilderForm'
import { groupByZone } from '@/features/quotes/utils/group-by-zone'
import { LABOR_LINE_NAME, CABLES_LINE_NAME, DEFAULT_LABOR_RATE, DEFAULT_CABLES_RATE, type TaxLine } from '@/features/quotes/utils/taxes'
import { DEFAULT_INTRO_MESSAGE, DEFAULT_PAYMENT_TERMS, DEFAULT_DELIVERY_TIME_TEXT, DEFAULT_VALIDITY_TEXT, DEFAULT_NOTES } from '@/features/quotes/constants'
import { getTranslator } from '@/lib/i18n/server'
import type { IncomingOrder } from '@/features/quotes/utils/estimate'
import type { QuoteItemWithProduct } from '@/features/quotes/types'
import type { QuoteTax } from '@/types/database'

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const profile = await getCurrentProfile()
  const { t } = await getTranslator()

  const { data: quote } = await supabase
    .from('quotes')
    .select('id, client_id, project_type, status, commercial_id, current_version_id')
    .eq('id', id)
    .single()

  if (!quote) {
    redirect('/quotes')
  }

  const canEdit = profile?.role === 'gerente' || (profile?.role === 'comercial' && profile.id === quote.commercial_id)
  if (!canEdit || quote.status !== 'draft' || !quote.current_version_id) {
    redirect(`/quotes/${id}`)
  }

  const [{ data: currentVersion }, { data: currentItemsRaw }, { data: currentTaxes }] = await Promise.all([
    supabase.from('quote_versions').select('*').eq('id', quote.current_version_id).single(),
    supabase.from('quote_items').select('*, product:products(id, name, sku)').eq('quote_version_id', quote.current_version_id),
    supabase.from('quote_taxes').select('*').eq('quote_version_id', quote.current_version_id),
  ])

  const currentItems = (currentItemsRaw ?? []) as QuoteItemWithProduct[]
  const taxRows = (currentTaxes ?? []) as QuoteTax[]

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
      .select('id, name, description, sku, category:categories(name, parent:parent_id(name)), brand:brands(name), line, condition, supply_model, image_url, reference_url, unit_price, unit_cost')
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

  const productOptions = (products ?? []).map((p) => {
    const category = p.category as unknown as { name: string; parent: { name: string } | null } | null
    return {
      ...p,
      category: category?.parent?.name ?? category?.name ?? '',
      subcategory: category?.parent ? category.name : null,
      brand: (p.brand as unknown as { name: string } | null)?.name ?? null,
      available_with_quotes: availabilityMap.get(p.id) ?? 0,
      is_favorite: favoriteIds.has(p.id),
    }
  })

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

  const laborTax = taxRows.find((tax) => tax.name === LABOR_LINE_NAME)
  const cablesTax = taxRows.find((tax) => tax.name === CABLES_LINE_NAME)
  const otherTaxes: TaxLine[] = taxRows
    .filter((tax) => tax.name !== LABOR_LINE_NAME && tax.name !== CABLES_LINE_NAME)
    .map((tax) => ({ name: tax.name, rate: tax.rate, kind: tax.kind, enabled: tax.enabled }))

  const zonesInitial = groupByZone(currentItems).map((group) => ({
    name: group.zoneName,
    items: group.items.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
  }))

  const initial: QuoteBuilderEditInitial = {
    clientId: quote.client_id,
    projectType: quote.project_type,
    zones: zonesInitial,
    discountEnabled: (currentVersion?.discount_percent ?? 0) > 0,
    discountPercent: currentVersion?.discount_percent ?? 0,
    laborEnabled: laborTax?.enabled ?? true,
    laborPercent: laborTax?.rate ?? DEFAULT_LABOR_RATE,
    cablesEnabled: cablesTax?.enabled ?? true,
    cablesPercent: cablesTax?.rate ?? DEFAULT_CABLES_RATE,
    taxes: otherTaxes,
    introMessage: currentVersion?.intro_message ?? DEFAULT_INTRO_MESSAGE,
    paymentTerms: currentVersion?.payment_terms ?? DEFAULT_PAYMENT_TERMS,
    deliveryTimeText: currentVersion?.delivery_time_text ?? DEFAULT_DELIVERY_TIME_TEXT,
    validityText: currentVersion?.validity_text ?? DEFAULT_VALIDITY_TEXT,
    notes: currentVersion?.notes ?? DEFAULT_NOTES,
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link
        href={`/quotes/${id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate transition-colors hover:text-navy"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12.5 15L7.5 10L12.5 5" />
        </svg>
        {t('quoteDetail.backToDetail')}
      </Link>

      <h1 className="mt-3 font-heading text-3xl font-bold text-navy">{t('quoteEdit.title')}</h1>
      <p className="mt-1 text-slate">{t('quoteEdit.subtitle')}</p>

      <div className="mt-6">
        <QuoteBuilderForm
          clients={clients ?? []}
          products={productOptions}
          incomingOrders={incomingOrders}
          maxDiscountPercent={discountRule?.max_discount_percent ?? 0}
          templates={templates ?? []}
          currentProfileId={profile?.id ?? ''}
          isGerente={profile?.role === 'gerente'}
          editMode={{ quoteId: id, initial }}
        />
      </div>
    </div>
  )
}
