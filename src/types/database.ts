export type UserRole = 'comercial' | 'inventarios' | 'compras' | 'gerente'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  parent_id: string | null
  created_at: string
}

export interface Brand {
  id: string
  name: string
  created_at: string
}

export type ProductCondition = 'nuevo' | 'usado' | 'averiado'
export type ProductSupplyModel = 'inventario' | 'bajo_pedido'

export interface Product {
  id: string
  sku: string | null
  name: string
  category_id: string
  brand_id: string | null
  supplier_id: string | null
  unit_price: number
  unit_cost: number | null
  currency: string
  condition: ProductCondition
  supply_model: ProductSupplyModel
  low_stock_threshold: number
  is_active: boolean
  image_url: string | null
  reference_url: string | null
  created_at: string
  updated_at: string
}

export interface ProductAttribute {
  id: string
  name: string
  created_at: string
}

export interface ProductAttributeValue {
  id: string
  product_id: string
  attribute_id: string
  value: string
}

export interface Inventory {
  product_id: string
  quantity_on_hand: number
  updated_at: string
  updated_by: string | null
}

export interface InventoryAvailability {
  product_id: string
  quantity_on_hand: number
  committed_in_quotes: number
  available_with_quotes: number
}

export type PurchaseOrderStatus = 'pending' | 'partial' | 'received' | 'cancelled'

export interface PurchaseOrder {
  id: string
  supplier_id: string
  status: PurchaseOrderStatus
  expected_arrival_date: string
  created_by: string
  created_at: string
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  product_id: string
  quantity: number
  unit_cost: number | null
}

export type ClientType =
  | 'constructora'
  | 'cliente_final'
  | 'estudio_diseno'
  | 'arquitecto'
  | 'administracion_ph'
  | 'distribuidor'
  | 'otro'

export interface Client {
  id: string
  name: string
  whatsapp: string | null
  email: string | null
  address: string | null
  client_type: ClientType
  created_by: string | null
  created_at: string
}

export interface DiscountRule {
  role: UserRole
  max_discount_percent: number
}

export type QuoteStatus = 'draft' | 'sent' | 'pending_approval' | 'approved' | 'rejected' | 'expired'

export interface Quote {
  id: string
  client_id: string
  commercial_id: string
  project_type: string
  status: QuoteStatus
  current_version_id: string | null
  created_at: string
  updated_at: string
}

export interface QuoteVersion {
  id: string
  quote_id: string
  version_number: number
  subtotal: number
  discount_percent: number
  total: number
  estimated_delivery_date: string | null
  requires_approval: boolean
  approved_by: string | null
  approved_at: string | null
  created_by: string
  created_at: string
}

export interface QuoteItem {
  id: string
  quote_version_id: string
  product_id: string
  quantity: number
  unit_price: number
  zone_name: string | null
}

export type QuoteTaxKind = 'add' | 'withhold'

export interface QuoteTax {
  id: string
  quote_version_id: string
  name: string
  rate: number
  kind: QuoteTaxKind
  enabled: boolean
  amount: number
}

export interface ProductFavorite {
  profile_id: string
  product_id: string
  created_at: string
}

export interface QuoteTemplate {
  id: string
  name: string
  is_shared: boolean
  created_by: string
  created_at: string
}

export interface QuoteTemplateItem {
  id: string
  template_id: string
  product_id: string
  quantity: number
  zone_name: string | null
}

export type QuoteSignatureDecision = 'approved' | 'rejected'

export interface QuoteSignature {
  id: string
  quote_version_id: string
  share_token: string
  viewed_at: string | null
  decision: QuoteSignatureDecision | null
  signature_data: string | null
  signer_name: string | null
  signer_ip: string | null
  decided_at: string | null
  created_at: string
}

export type NotificationChannel = 'whatsapp' | 'email'
export type NotificationEvent = 'quote_sent' | 'quote_viewed' | 'quote_approved' | 'quote_rejected'
export type NotificationStatus = 'pending' | 'sent' | 'failed'

export interface NotificationLog {
  id: string
  quote_id: string
  channel: NotificationChannel
  recipient: string
  event: NotificationEvent
  status: NotificationStatus
  provider_message_id: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      suppliers: {
        Row: Supplier
        Insert: Omit<Supplier, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<Supplier, 'id'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<Category, 'id' | 'created_at'>>
      }
      brands: {
        Row: Brand
        Insert: Omit<Brand, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<Brand, 'id' | 'created_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Product, 'id' | 'created_at'>>
      }
      product_attributes: {
        Row: ProductAttribute
        Insert: Omit<ProductAttribute, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<ProductAttribute, 'id' | 'created_at'>>
      }
      product_attribute_values: {
        Row: ProductAttributeValue
        Insert: Omit<ProductAttributeValue, 'id'> & { id?: string }
        Update: Partial<Omit<ProductAttributeValue, 'id'>>
      }
      inventory: {
        Row: Inventory
        Insert: Omit<Inventory, 'updated_at'>
        Update: Partial<Omit<Inventory, 'product_id'>>
      }
      purchase_orders: {
        Row: PurchaseOrder
        Insert: Omit<PurchaseOrder, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<PurchaseOrder, 'id' | 'created_at'>>
      }
      purchase_order_items: {
        Row: PurchaseOrderItem
        Insert: Omit<PurchaseOrderItem, 'id'> & { id?: string }
        Update: Partial<Omit<PurchaseOrderItem, 'id'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<Client, 'id' | 'created_at'>>
      }
      discount_rules: {
        Row: DiscountRule
        Insert: DiscountRule
        Update: Partial<Omit<DiscountRule, 'role'>>
      }
      quotes: {
        Row: Quote
        Insert: Omit<Quote, 'id' | 'created_at' | 'updated_at' | 'current_version_id'> & {
          id?: string
          current_version_id?: string | null
        }
        Update: Partial<Omit<Quote, 'id' | 'created_at'>>
      }
      quote_versions: {
        Row: QuoteVersion
        Insert: Omit<QuoteVersion, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<QuoteVersion, 'id' | 'quote_id' | 'created_at'>>
      }
      quote_items: {
        Row: QuoteItem
        Insert: Omit<QuoteItem, 'id'> & { id?: string }
        Update: Partial<Omit<QuoteItem, 'id'>>
      }
      quote_signatures: {
        Row: QuoteSignature
        Insert: Omit<QuoteSignature, 'id' | 'created_at' | 'share_token'> & {
          id?: string
          share_token?: string
        }
        Update: Partial<Omit<QuoteSignature, 'id' | 'quote_version_id' | 'created_at'>>
      }
      notifications_log: {
        Row: NotificationLog
        Insert: Omit<NotificationLog, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<NotificationLog, 'id'>>
      }
      quote_taxes: {
        Row: QuoteTax
        Insert: Omit<QuoteTax, 'id'> & { id?: string }
        Update: Partial<Omit<QuoteTax, 'id' | 'quote_version_id'>>
      }
      product_favorites: {
        Row: ProductFavorite
        Insert: Omit<ProductFavorite, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<ProductFavorite, 'profile_id' | 'product_id'>>
      }
      quote_templates: {
        Row: QuoteTemplate
        Insert: Omit<QuoteTemplate, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<QuoteTemplate, 'id' | 'created_at'>>
      }
      quote_template_items: {
        Row: QuoteTemplateItem
        Insert: Omit<QuoteTemplateItem, 'id'> & { id?: string }
        Update: Partial<Omit<QuoteTemplateItem, 'id' | 'template_id'>>
      }
    }
    Views: {
      inventory_availability: {
        Row: InventoryAvailability
      }
    }
  }
}
