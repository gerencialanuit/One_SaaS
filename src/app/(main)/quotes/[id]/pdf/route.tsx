import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { QuotePdfDocument, type QuotePdfData } from '@/features/quotes/pdf/QuotePdfDocument'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: quote } = await supabase.from('quotes').select('*, client:clients(name)').eq('id', id).single()
  if (!quote || !quote.current_version_id) {
    return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
  }

  const { data: version } = await supabase
    .from('quote_versions')
    .select('*')
    .eq('id', quote.current_version_id)
    .single()

  const { data: itemsRaw } = await supabase
    .from('quote_items')
    .select('quantity, unit_price, zone_name, product:products(name)')
    .eq('quote_version_id', quote.current_version_id)

  const { data: taxesRaw } = await supabase
    .from('quote_taxes')
    .select('name, rate, kind, enabled, amount')
    .eq('quote_version_id', quote.current_version_id)

  if (!version) {
    return NextResponse.json({ error: 'Versión no encontrada' }, { status: 404 })
  }

  const items = (itemsRaw ?? []) as unknown as {
    quantity: number
    unit_price: number
    zone_name: string | null
    product: { name: string } | null
  }[]

  const pdfData: QuotePdfData = {
    clientName: quote.client?.name ?? '—',
    projectType: quote.project_type,
    versionNumber: version.version_number,
    items: items.map((item) => ({
      productName: item.product?.name ?? '—',
      quantity: item.quantity,
      unitPrice: item.unit_price,
      zoneName: item.zone_name,
    })),
    subtotal: version.subtotal,
    discountPercent: version.discount_percent,
    taxes: taxesRaw ?? [],
    total: version.total,
    estimatedDeliveryDate: version.estimated_delivery_date,
  }

  const buffer = await renderToBuffer(<QuotePdfDocument data={pdfData} />)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="cotizacion-${quote.id}.pdf"`,
    },
  })
}
