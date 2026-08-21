import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { QuotePdfDocument, type QuotePdfData } from '@/features/quotes/pdf/QuotePdfDocument'

interface SharedQuoteRpcItem {
  product_name: string
  quantity: number
  unit_price: number
  zone_name: string | null
}

interface SharedQuoteRpcTax {
  name: string
  rate: number
  kind: 'add' | 'withhold'
  enabled: boolean
  amount: number
}

interface SharedQuoteRpcResult {
  quote_id: string
  project_type: string
  client_name: string
  version_number: number
  subtotal: number
  discount_percent: number
  total: number
  estimated_delivery_date: string | null
  items: SharedQuoteRpcItem[]
  taxes: SharedQuoteRpcTax[]
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_shared_quote', { p_token: token })
  const shared = data as SharedQuoteRpcResult | null

  if (error || !shared) {
    return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
  }

  const pdfData: QuotePdfData = {
    clientName: shared.client_name,
    projectType: shared.project_type,
    versionNumber: shared.version_number,
    items: shared.items.map((item) => ({
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      zoneName: item.zone_name,
    })),
    subtotal: shared.subtotal,
    discountPercent: shared.discount_percent,
    taxes: shared.taxes ?? [],
    total: shared.total,
    estimatedDeliveryDate: shared.estimated_delivery_date,
  }

  const buffer = await renderToBuffer(<QuotePdfDocument data={pdfData} />)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="cotizacion-${shared.quote_id}.pdf"`,
    },
  })
}
