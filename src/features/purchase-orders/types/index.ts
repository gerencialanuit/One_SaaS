import type { Supplier, PurchaseOrder, PurchaseOrderItem } from '@/types/database'

export interface PurchaseOrderItemWithProduct extends PurchaseOrderItem {
  product: { id: string; name: string; sku: string | null } | null
}

export interface PurchaseOrderWithDetails extends PurchaseOrder {
  supplier: Supplier | null
  items: PurchaseOrderItemWithProduct[]
}

export interface ProductOption {
  id: string
  name: string
  sku: string | null
}
