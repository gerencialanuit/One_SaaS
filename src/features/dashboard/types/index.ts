export interface QuoteSummary {
  id: string
  clientName: string
  projectType: string
  status: string
  total: number
  estimatedDeliveryDate: string | null
  createdAt: string
  updatedAt: string
}

export interface HotQuote {
  quoteId: string
  clientName: string
  total: number
  viewedAt: string
}

export interface LowStockProduct {
  id: string
  name: string
  sku: string | null
  available: number
  threshold: number
}

export interface UpcomingArrival {
  id: string
  supplierName: string
  expectedArrivalDate: string
  itemsSummary: string
  daysUntilArrival: number
}

export interface InventoryValueByCategory {
  category: string
  value: number
}

export interface TopClient {
  clientId: string
  clientName: string
  totalValue: number
  quoteCount: number
}

export interface DashboardData {
  quotes: QuoteSummary[]
  pendingApprovals: QuoteSummary[]
  hotQuotes: HotQuote[]
  lowStockProducts: LowStockProduct[]
  upcomingArrivals: UpcomingArrival[]
  inventoryValueByCategory: InventoryValueByCategory[]
  topClients: TopClient[]
}
