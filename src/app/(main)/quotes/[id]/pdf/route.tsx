import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { QuotePdfDocument, type QuotePdfData } from '@/features/quotes/pdf/QuotePdfDocument'
import { toPdfImageSrcMap } from '@/features/quotes/pdf/pdfImage'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, client:clients(name, city), commercial:profiles(full_name, email, cargo, commercial_email)')
    .eq('id', id)
    .single()
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
    .select('quantity, unit_price, zone_name, product:products(name, description, image_url)')
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
    product: { name: string; description: string | null; image_url: string | null } | null
  }[]

  const imageMap = await toPdfImageSrcMap(items.map((item) => item.product?.image_url ?? null))

  const pdfData: QuotePdfData = {
    quoteNumber: quote.quote_number,
    issuedDate: version.created_at.slice(0, 10),
    clientName: quote.client?.name ?? '—',
    clientCity: quote.client?.city ?? null,
    projectType: quote.project_type,
    introMessage: version.intro_message,
    versionNumber: version.version_number,
    items: items.map((item) => ({
      productName: item.product?.name ?? '—',
      productDescription: item.product?.description ?? null,
      imageUrl: item.product?.image_url ? (imageMap.get(item.product.image_url) ?? null) : null,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      zoneName: item.zone_name,
    })),
    subtotal: version.subtotal,
    discountPercent: version.discount_percent,
    taxes: taxesRaw ?? [],
    total: version.total,
    paymentTerms: version.payment_terms,
    deliveryTimeText: version.delivery_time_text,
    validityText: version.validity_text,
    notes: version.notes,
    commercialName: quote.commercial?.full_name || quote.commercial?.email || '—',
    commercialCargo: quote.commercial?.cargo ?? null,
    commercialEmail: quote.commercial?.commercial_email || quote.commercial?.email || '—',
  }

  const buffer = await renderToBuffer(<QuotePdfDocument data={pdfData} />)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="cotizacion-${quote.quote_number}.pdf"`,
    },
  })
}
