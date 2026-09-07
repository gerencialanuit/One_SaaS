import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { readFileSync } from 'fs'
import path from 'path'
import { sortTaxesForDisplay, LABOR_LINE_NAME, CABLES_LINE_NAME } from '../utils/taxes'

const LOGO_SRC = `data:image/png;base64,${readFileSync(path.join(process.cwd(), 'public', 'logo-one.png')).toString('base64')}`

// Datos propios de ONE (no del cliente) para el pie de pagina del PDF.
const COMPANY_NAME = 'ONE casas y espacios inteligentes'
const COMPANY_ADDRESS = 'Av. Cra. 9 # 77-67, Bogotá D.C.'
const COMPANY_PHONE = '+57 (1) 312 328 1386'

export interface QuotePdfItem {
  productName: string
  productDescription: string | null
  imageUrl: string | null
  quantity: number
  unitPrice: number
  zoneName: string | null
}

export interface QuotePdfTax {
  name: string
  rate: number
  kind: 'add' | 'withhold'
  enabled: boolean
  amount: number
}

export interface QuotePdfData {
  quoteNumber: string
  issuedDate: string
  versionNumber: number
  clientName: string
  clientCity: string | null
  projectType: string
  introMessage: string
  items: QuotePdfItem[]
  subtotal: number
  discountPercent: number
  taxes: QuotePdfTax[]
  total: number
  paymentTerms: string
  deliveryTimeText: string
  validityText: string
  notes: string
  commercialName: string
  commercialCargo: string | null
  commercialEmail: string
}

const currency = (value: number) => `$${Math.round(value).toLocaleString('es-CO')}`
const NO_ZONE_LABEL = 'Sin zona'

function groupItemsByZone(items: QuotePdfItem[]): { zoneName: string; items: QuotePdfItem[] }[] {
  const map = new Map<string, QuotePdfItem[]>()
  for (const item of items) {
    const key = item.zoneName || NO_ZONE_LABEL
    const list = map.get(key)
    if (list) {
      list.push(item)
    } else {
      map.set(key, [item])
    }
  }
  return Array.from(map.entries()).map(([zoneName, zoneItems]) => ({ zoneName, items: zoneItems }))
}

const COLOR_TEXT = '#111111'
const COLOR_MUTED = '#595959'
const COLOR_LABEL = '#333333'
const COLOR_BORDER = '#D8D8D8'
const COLOR_ORANGE = '#F15523'
const COLOR_ORANGE_DARK = '#C6431A'
const COLOR_COMPANY_LINE = '#1E3A5F'

// Los tamanos de aqui reproducen el formato que se definio en el diseno
// (medido en px a 96dpi) convertido a puntos de PDF (1px = 0.75pt) — el
// documento puede terminar ocupando varias paginas y esta bien: no se debe
// reducir el texto ni las fotos de producto para que quepa en una sola.
const styles = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 56, paddingHorizontal: 42, fontSize: 10, color: COLOR_TEXT },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { width: 135, height: 39.2 },
  headerRight: { alignItems: 'flex-end' },
  quoteLabel: { fontSize: 8, fontWeight: 700, letterSpacing: 1, color: COLOR_LABEL, textTransform: 'uppercase' },
  quoteNumber: { fontSize: 19.5, fontWeight: 700, color: COLOR_TEXT, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 5 },
  metaDate: { fontSize: 9.8, color: COLOR_MUTED },
  versionPill: {
    fontSize: 8.3,
    fontWeight: 700,
    color: COLOR_ORANGE_DARK,
    borderWidth: 1,
    borderColor: COLOR_ORANGE_DARK,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  accentBar: { flexDirection: 'row', height: 3, borderRadius: 1.5, marginTop: 20, marginBottom: 20, overflow: 'hidden' },
  clientBlock: { paddingBottom: 19, borderBottomWidth: 1, borderBottomColor: COLOR_BORDER },
  clientLine: { fontSize: 10.5, fontWeight: 700, color: COLOR_TEXT, textTransform: 'uppercase', marginBottom: 4 },
  clientValue: { fontWeight: 400, textTransform: 'none' },
  introText: { fontSize: 10.9, color: COLOR_TEXT, lineHeight: 1.5, marginTop: 10, textAlign: 'justify' },
  zoneBlock: { marginTop: 27 },
  zonePill: {
    alignSelf: 'flex-start',
    fontSize: 9.8,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLOR_ORANGE,
    borderWidth: 1,
    borderColor: COLOR_ORANGE,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 10,
  },
  tableHeaderRow: { flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 5, borderBottomWidth: 1.2, borderBottomColor: COLOR_TEXT },
  th: { fontSize: 8.3, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: COLOR_LABEL },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.75, borderBottomColor: COLOR_BORDER },
  colItemNo: { width: 24, fontSize: 9, color: COLOR_LABEL },
  colPhoto: { width: 87, height: 87, marginRight: 12, borderWidth: 1, borderColor: COLOR_BORDER, borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoImg: { width: '92%', height: '92%', objectFit: 'contain' },
  colName: { flex: 1, paddingRight: 8 },
  itemTitle: { fontSize: 12.4, fontWeight: 700, color: COLOR_TEXT },
  itemSub: { fontSize: 9.4, color: COLOR_MUTED, marginTop: 3 },
  colQty: { width: 40, textAlign: 'center', fontSize: 12 },
  colUnit: { width: 74, textAlign: 'right', fontSize: 12 },
  colTotal: { width: 76, textAlign: 'right', fontSize: 12, fontWeight: 700 },
  totalsWrap: { alignItems: 'flex-end', marginTop: 30 },
  totalsBox: { width: 300, borderWidth: 1, borderColor: COLOR_BORDER, borderRadius: 12, padding: 18 },
  tline: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  tlineLabel: { flex: 1, paddingRight: 8, fontSize: 10.5, color: COLOR_MUTED },
  tlineBoldLabel: { flex: 1, paddingRight: 8, fontSize: 10.5, fontWeight: 700, color: COLOR_TEXT },
  tlineValue: { fontSize: 10.5, color: COLOR_TEXT, fontWeight: 700, textAlign: 'right' },
  divider: { height: 1, backgroundColor: COLOR_BORDER, marginVertical: 7 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLOR_ORANGE, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11 },
  grandTotalLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: '#FFFFFF' },
  grandTotalValue: { fontSize: 17.25, fontWeight: 700, color: '#FFFFFF' },
  conditionsBlock: { marginTop: 30 },
  conditionsTitle: { fontSize: 9.8, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: COLOR_TEXT, marginBottom: 10 },
  conditionsRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLOR_BORDER, paddingVertical: 14 },
  conditionsCol: { flex: 1, paddingRight: 10 },
  conditionsLabel: { fontSize: 8, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: COLOR_LABEL },
  conditionsValue: { fontSize: 11.25, color: COLOR_TEXT, marginTop: 4, lineHeight: 1.35 },
  notesText: { fontSize: 9.8, color: COLOR_MUTED, fontStyle: 'italic', marginTop: 10 },
  footer: {
    marginTop: 35,
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: COLOR_BORDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerCol: { flex: 1 },
  footerColClient: { flex: 1 },
  footerLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: COLOR_TEXT },
  footerValue: { fontSize: 9.8, color: COLOR_TEXT, marginTop: 5 },
  footerValueMuted: { fontSize: 9.4, color: COLOR_MUTED, marginTop: 2 },
  companyLine: {
    position: 'absolute',
    bottom: 22,
    left: 42,
    right: 42,
    fontSize: 9,
    color: COLOR_COMPANY_LINE,
    textAlign: 'center',
  },
  pageNumber: { position: 'absolute', bottom: 8, right: 42, fontSize: 8.5, color: COLOR_MUTED },
})

export function QuotePdfDocument({ data }: { data: QuotePdfData }) {
  const zoneGroups = groupItemsByZone(data.items)
  const cablesTax = data.taxes.find((tax) => tax.name === CABLES_LINE_NAME && tax.enabled)
  const laborTax = data.taxes.find((tax) => tax.name === LABOR_LINE_NAME && tax.enabled)
  const otherTaxes = sortTaxesForDisplay(data.taxes.filter((tax) => tax.name !== CABLES_LINE_NAME && tax.name !== LABOR_LINE_NAME))
  const displaySubtotal = data.subtotal + (cablesTax?.amount ?? 0) + (laborTax?.amount ?? 0)
  const discountAmount = data.subtotal * (data.discountPercent / 100)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={LOGO_SRC} style={styles.logo} />
          <View style={styles.headerRight}>
            <Text style={styles.quoteLabel}>Cotización</Text>
            <Text style={styles.quoteNumber}>{data.quoteNumber}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaDate}>Emitida el {data.issuedDate}</Text>
              <Text style={styles.versionPill}>Versión {data.versionNumber}</Text>
            </View>
          </View>
        </View>

        <View style={styles.accentBar}>
          <View style={{ flex: 1, backgroundColor: '#C6231F' }} />
          <View style={{ flex: 1, backgroundColor: COLOR_ORANGE }} />
          <View style={{ flex: 1, backgroundColor: '#FFC414' }} />
        </View>

        <View style={styles.clientBlock}>
          <Text style={styles.clientLine}>
            Señor (A): <Text style={styles.clientValue}>{data.clientName}</Text>
          </Text>
          <Text style={styles.clientLine}>
            Proyecto: <Text style={styles.clientValue}>{data.projectType}</Text>
          </Text>
          {data.clientCity && (
            <Text style={styles.clientLine}>
              Ciudad: <Text style={styles.clientValue}>{data.clientCity}</Text>
            </Text>
          )}
          <Text style={styles.introText}>{data.introMessage}</Text>
        </View>

        {(() => {
          let itemNumber = 0
          return zoneGroups.map((group) => (
            <View key={group.zoneName} style={styles.zoneBlock}>
              <View wrap={false} minPresenceAhead={100}>
                <Text style={styles.zonePill}>{group.zoneName}</Text>

                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.th, styles.colItemNo]}>Ítem</Text>
                  <View style={{ width: 87, marginRight: 12 }} />
                  <Text style={[styles.th, styles.colName]}>Equipo</Text>
                  <Text style={[styles.th, styles.colQty]}>Cant.</Text>
                  <Text style={[styles.th, styles.colUnit]}>V. Unit.</Text>
                  <Text style={[styles.th, styles.colTotal]}>V. Total</Text>
                </View>
              </View>

              {group.items.map((item, index) => {
                itemNumber += 1
                return (
                  <View key={index} style={styles.row} wrap={false}>
                    <Text style={styles.colItemNo}>{itemNumber}</Text>
                    <View style={styles.colPhoto}>
                      {item.imageUrl && <Image src={item.imageUrl} style={styles.photoImg} />}
                    </View>
                    <View style={styles.colName}>
                      <Text style={styles.itemTitle}>{item.productName}</Text>
                      {item.productDescription && <Text style={styles.itemSub}>{item.productDescription}</Text>}
                    </View>
                    <Text style={styles.colQty}>{item.quantity}</Text>
                    <Text style={styles.colUnit}>{currency(item.unitPrice)}</Text>
                    <Text style={styles.colTotal}>{currency(item.quantity * item.unitPrice)}</Text>
                  </View>
                )
              })}
            </View>
          ))
        })()}

        <View style={styles.totalsWrap} wrap={false}>
          <View style={styles.totalsBox}>
            <View style={styles.tline}>
              <Text style={styles.tlineLabel}>Subtotal equipos</Text>
              <Text style={styles.tlineValue}>{currency(data.subtotal)}</Text>
            </View>
            {cablesTax && (
              <View style={styles.tline}>
                <Text style={styles.tlineLabel}>Cables y accesorios</Text>
                <Text style={styles.tlineValue}>{currency(cablesTax.amount)}</Text>
              </View>
            )}
            {laborTax && (
              <View style={styles.tline}>
                <Text style={styles.tlineLabel}>Mano de obra (instalación y programación)</Text>
                <Text style={styles.tlineValue}>{currency(laborTax.amount)}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.tline}>
              <Text style={styles.tlineBoldLabel}>Subtotal</Text>
              <Text style={styles.tlineValue}>{currency(displaySubtotal)}</Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.tline}>
                <Text style={styles.tlineLabel}>Descuento comercial ({data.discountPercent}%)</Text>
                <Text style={styles.tlineValue}>-{currency(discountAmount)}</Text>
              </View>
            )}
            {otherTaxes.filter((tax) => tax.enabled).map((tax) => (
              <View key={tax.name} style={styles.tline}>
                <Text style={styles.tlineLabel}>
                  {tax.name} ({tax.rate}%){tax.kind === 'withhold' ? ' — retención' : ''}
                </Text>
                <Text style={styles.tlineValue}>
                  {tax.kind === 'withhold' ? `-${currency(tax.amount)}` : `+${currency(tax.amount)}`}
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{currency(data.total)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.conditionsBlock} wrap={false}>
          <Text style={styles.conditionsTitle}>Condiciones comerciales</Text>
          <View style={styles.conditionsRow}>
            <View style={styles.conditionsCol}>
              <Text style={styles.conditionsLabel}>Forma de pago</Text>
              <Text style={styles.conditionsValue}>{data.paymentTerms}</Text>
            </View>
            <View style={styles.conditionsCol}>
              <Text style={styles.conditionsLabel}>Tiempo de entrega</Text>
              <Text style={styles.conditionsValue}>{data.deliveryTimeText}</Text>
            </View>
            <View style={[styles.conditionsCol, { paddingRight: 0 }]}>
              <Text style={styles.conditionsLabel}>Validez de la oferta</Text>
              <Text style={styles.conditionsValue}>{data.validityText}</Text>
            </View>
          </View>
          {data.notes && <Text style={styles.notesText}>Nota: {data.notes}</Text>}
        </View>

        <View style={styles.footer} wrap={false}>
          <View style={styles.footerCol}>
            <Text style={styles.footerLabel}>{data.commercialCargo || 'Project Manager'}</Text>
            <Text style={styles.footerValue}>{data.commercialName}</Text>
            <Text style={styles.footerValueMuted}>{data.commercialEmail}</Text>
          </View>
          <View style={styles.footerColClient}>
            <Text style={styles.footerLabel}>Cliente</Text>
            <Text style={styles.footerValue}>{data.clientName}</Text>
          </View>
        </View>
        <Text style={styles.companyLine} fixed>
          {COMPANY_NAME} · {COMPANY_ADDRESS} · Teléfono {COMPANY_PHONE}
        </Text>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}
