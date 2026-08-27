import { createClient } from '@/lib/supabase/server'
import type {
  DashboardData,
  QuoteSummary,
  HotQuote,
  LowStockProduct,
  UpcomingArrival,
  InventoryValueByCategory,
  TopClient,
} from '../types'

interface QuoteRow {
  id: string
  client_id: string
  project_type: string
  status: string
  created_at: string
  updated_at: string
  current_version_id: string | null
  client: { name: string } | null
  current_version: { total: number; estimated_delivery_date: string | null } | null
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()

  const [{ data: quotesRaw }, { data: signaturesRaw }, { data: productsRaw }, { data: availabilityRaw }, { data: posRaw }, { data: inventoryProductsRaw }] =
    await Promise.all([
      supabase
        .from('quotes')
        .select(
          '*, client:clients(name), current_version:quote_versions!quotes_current_version_id_fkey(total, estimated_delivery_date)'
        )
        .order('created_at', { ascending: false }),
      supabase.from('quote_signatures').select('quote_version_id, viewed_at, decision'),
      supabase.from('products').select('id, name, sku, low_stock_threshold').eq('is_active', true).eq('supply_model', 'inventario'),
      supabase.from('inventory_availability').select('product_id, available_with_quotes, quantity_on_hand'),
      supabase
        .from('purchase_orders')
        .select('id, expected_arrival_date, supplier:suppliers(name), items:purchase_order_items(quantity, product:products(name))')
        .eq('status', 'pending')
        .order('expected_arrival_date', { ascending: true }),
      supabase.from('products').select('id, category, unit_price, unit_cost').eq('is_active', true),
    ])

  const quantityOnHandMap = new Map((availabilityRaw ?? []).map((a) => [a.product_id, a.quantity_on_hand]))
  const inventoryValueMap = new Map<string, number>()
  for (const p of inventoryProductsRaw ?? []) {
    const quantityOnHand = quantityOnHandMap.get(p.id) ?? 0
    const unitValue = p.unit_cost ?? p.unit_price
    const value = quantityOnHand * unitValue
    inventoryValueMap.set(p.category, (inventoryValueMap.get(p.category) ?? 0) + value)
  }
  const inventoryValueByCategory: InventoryValueByCategory[] = Array.from(inventoryValueMap.entries())
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value)

  const quotes: QuoteSummary[] = ((quotesRaw as unknown as QuoteRow[]) ?? []).map((q) => ({
    id: q.id,
    clientName: q.client?.name ?? '—',
    projectType: q.project_type,
    status: q.status,
    total: q.current_version?.total ?? 0,
    estimatedDeliveryDate: q.current_version?.estimated_delivery_date ?? null,
    createdAt: q.created_at,
    updatedAt: q.updated_at,
  }))

  const pendingApprovals = ((quotesRaw as unknown as QuoteRow[]) ?? [])
    .filter((q) => q.status === 'pending_approval')
    .map((q) => ({
      id: q.id,
      clientName: q.client?.name ?? '—',
      projectType: q.project_type,
      status: q.status,
      total: q.current_version?.total ?? 0,
      estimatedDeliveryDate: q.current_version?.estimated_delivery_date ?? null,
      createdAt: q.created_at,
      updatedAt: q.updated_at,
    }))

  const currentVersionMap = new Map(
    ((quotesRaw as unknown as QuoteRow[]) ?? []).map((q) => [q.current_version_id, q])
  )

  const hotQuotes: HotQuote[] = (signaturesRaw ?? [])
    .filter((s) => s.viewed_at && !s.decision)
    .map((s) => {
      const quote = currentVersionMap.get(s.quote_version_id)
      if (!quote) return null
      return {
        quoteId: quote.id,
        clientName: quote.client?.name ?? '—',
        total: quote.current_version?.total ?? 0,
        viewedAt: s.viewed_at as string,
      }
    })
    .filter((x): x is HotQuote => x !== null)
    .sort((a, b) => a.viewedAt.localeCompare(b.viewedAt))

  const availabilityMap = new Map((availabilityRaw ?? []).map((a) => [a.product_id, a.available_with_quotes]))
  const lowStockProducts: LowStockProduct[] = (productsRaw ?? [])
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      available: availabilityMap.get(p.id) ?? 0,
      threshold: p.low_stock_threshold,
    }))
    .filter((p) => p.available <= p.threshold)
    .sort((a, b) => a.available - b.available)

  const today = new Date().toISOString().slice(0, 10)
  const MS_PER_DAY = 1000 * 60 * 60 * 24
  const upcomingArrivals: UpcomingArrival[] = ((posRaw as unknown as Array<{
    id: string
    expected_arrival_date: string
    supplier: { name: string } | null
    items: Array<{ quantity: number; product: { name: string } | null }>
  }>) ?? []).map((po) => ({
    id: po.id,
    supplierName: po.supplier?.name ?? '—',
    expectedArrivalDate: po.expected_arrival_date,
    itemsSummary: po.items.map((item) => `${item.quantity}x ${item.product?.name ?? '—'}`).join(', '),
    daysUntilArrival: Math.round(
      (new Date(po.expected_arrival_date).getTime() - new Date(today).getTime()) / MS_PER_DAY
    ),
  }))

  const topClientsMap = new Map<string, TopClient>()
  for (const q of (quotesRaw as unknown as QuoteRow[]) ?? []) {
    if (q.status !== 'approved') continue
    const entry = topClientsMap.get(q.client_id) ?? {
      clientId: q.client_id,
      clientName: q.client?.name ?? '—',
      totalValue: 0,
      quoteCount: 0,
    }
    entry.totalValue += q.current_version?.total ?? 0
    entry.quoteCount += 1
    topClientsMap.set(q.client_id, entry)
  }
  const topClients: TopClient[] = Array.from(topClientsMap.values())
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5)

  return { quotes, pendingApprovals, hotQuotes, lowStockProducts, upcomingArrivals, inventoryValueByCategory, topClients }
}
