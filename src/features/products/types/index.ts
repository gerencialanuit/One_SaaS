import type { Product, InventoryAvailability, Category, Brand } from '@/types/database'

export interface ProductWithAvailability extends Product {
  availability: InventoryAvailability | null
  category: Category | null
  brand: Brand | null
  attribute_values: { attribute_id: string; name: string; value: string }[]
}

export interface SupplierOption {
  id: string
  name: string
}

export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[]
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
