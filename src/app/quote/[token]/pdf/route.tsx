import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { QuotePdfDocument, type QuotePdfData } from '@/features/quotes/pdf/QuotePdfDocument'
import { toPdfImageSrcMap } from '@/features/quotes/pdf/pdfImage'

interface SharedQuoteRpcItem {
  product_name: string
  product_description: string | null
  product_image_url: string | null
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
  quote_number: string
  project_type: string
  client_name: string
  client_city: string | null
  commercial_name: string | null
  commercial_cargo: string | null
  commercial_email: string | null
  version_number: number
  subtotal: number
  discount_percent: number
  total: number
  intro_message: string
  payment_terms: string
  delivery_time_text: string
  validity_text: string
  notes: string
  issued_date: string
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

  const imageMap = await toPdfImageSrcMap(shared.items.map((item) => item.product_image_url))

  const pdfData: QuotePdfData = {
    quoteNumber: shared.quote_number,
    issuedDate: shared.issued_date.slice(0, 10),
    clientName: shared.client_name,
    clientCity: shared.client_city,
    projectType: shared.project_type,
    introMessage: shared.intro_message,
    versionNumber: shared.version_number,
    items: shared.items.map((item) => ({
      productName: item.product_name,
      productDescription: item.product_description,
      imageUrl: item.product_image_url ? (imageMap.get(item.product_image_url) ?? null) : null,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      zoneName: item.zone_name,
    })),
    subtotal: shared.subtotal,
    discountPercent: shared.discount_percent,
    taxes: shared.taxes ?? [],
    total: shared.total,
    paymentTerms: shared.payment_terms,
    deliveryTimeText: shared.delivery_time_text,
    validityText: shared.validity_text,
    notes: shared.notes,
    commercialName: shared.commercial_name || shared.commercial_email || '—',
    commercialCargo: shared.commercial_cargo,
    commercialEmail: shared.commercial_email ?? '—',
  }

  const buffer = await renderToBuffer(<QuotePdfDocument data={pdfData} />)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="cotizacion-${shared.quote_number}.pdf"`,
    },
  })
}
