import type { Quote, Client, QuoteVersion, QuoteTax, ProductCondition } from '@/types/database'

export interface QuoteProductOption {
  id: string
  name: string
  sku: string | null
  category: string
  brand: string | null
  condition: ProductCondition
  image_url: string | null
  unit_price: number
  available_with_quotes: number
  is_favorite?: boolean
}

export interface QuoteWithDetails extends Quote {
  client: Client | null
  commercial: { full_name: string | null; email: string } | null
  current_version: {
    id: string
    total: number
    estimated_delivery_date: string | null
  } | null
}

export interface QuoteItemWithProduct {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  zone_name: string | null
  product: { id: string; name: string; sku: string | null } | null
}

export interface QuoteDetailData extends Quote {
  client: Client | null
  commercial: { full_name: string | null; email: string } | null
  versions: QuoteVersion[]
  currentItems: QuoteItemWithProduct[]
  currentTaxes: QuoteTax[]
}
