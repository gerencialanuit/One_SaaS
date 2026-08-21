import type { Product, InventoryAvailability } from '@/types/database'

export interface ProductWithAvailability extends Product {
  availability: InventoryAvailability | null
}

export interface SupplierOption {
  id: string
  name: string
}
