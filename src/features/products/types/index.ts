import type { Product, InventoryAvailability } from '@/types/database'

export interface ProductWithAvailability extends Product {
  availability: InventoryAvailability | null
}

export interface SupplierOption {
  id: string
  name: string
}

export interface OpenPoLine {
  purchaseOrderId: string
  expectedArrivalDate: string
  quantity: number
  supplierName: string
}

export interface ProductOpenPoSummary {
  totalQuantity: number
  nearestDate: string | null
  lines: OpenPoLine[]
}
