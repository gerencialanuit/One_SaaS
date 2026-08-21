import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { readFileSync } from 'fs'
import path from 'path'
import { sortTaxesForDisplay } from '../utils/taxes'

const LOGO_SRC = `data:image/png;base64,${readFileSync(path.join(process.cwd(), 'public', 'logo-one.png')).toString('base64')}`

export interface QuotePdfItem {
  productName: string
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
  clientName: string
  projectType: string
  versionNumber: number
  items: QuotePdfItem[]
  subtotal: number
  discountPercent: number
  taxes: QuotePdfTax[]
  total: number
  estimatedDeliveryDate: string | null
}

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`
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

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, color: '#001B40' },
  header: { marginBottom: 24 },
  logo: { width: 140, height: 40.6 },
  title: { fontSize: 20, fontWeight: 700, color: '#001B40' },
  subtitle: { fontSize: 11, color: '#44536B', marginTop: 4 },
  section: { marginBottom: 16 },
  label: { fontSize: 9, color: '#64748B', marginBottom: 2 },
  value: { fontSize: 12, color: '#001B40' },
  zoneBlock: { marginTop: 14 },
  zoneTitle: { fontSize: 11, fontWeight: 700, color: '#0075DD', marginBottom: 4 },
  table: { borderTopWidth: 1, borderTopColor: '#E5E9EF' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E9EF', paddingVertical: 6 },
  tableHeaderRow: { flexDirection: 'row', paddingVertical: 6, backgroundColor: '#F7F9FC' },
  colProduct: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  headerText: { fontSize: 9, color: '#44536B', fontWeight: 700 },
  totals: { marginTop: 16, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  totalLabel: { fontSize: 10, color: '#44536B' },
  totalValue: { fontSize: 10, color: '#001B40', width: 90, textAlign: 'right' },
  grandTotal: { fontSize: 14, fontWeight: 700, color: '#001B40', width: 90, textAlign: 'right' },
})

export function QuotePdfDocument({ data }: { data: QuotePdfData }) {
  const zoneGroups = groupItemsByZone(data.items)
  const sortedTaxes = sortTaxesForDisplay(data.taxes)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={LOGO_SRC} style={styles.logo} />
          <Text style={styles.subtitle}>Cotización — {data.projectType} (v{data.versionNumber})</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Cliente</Text>
          <Text style={styles.value}>{data.clientName}</Text>
        </View>

        {zoneGroups.map((group) => (
          <View key={group.zoneName} style={styles.zoneBlock}>
            <Text style={styles.zoneTitle}>{group.zoneName}</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.colProduct, styles.headerText]}>Producto</Text>
                <Text style={[styles.colQty, styles.headerText]}>Cant.</Text>
                <Text style={[styles.colPrice, styles.headerText]}>Precio unit.</Text>
                <Text style={[styles.colTotal, styles.headerText]}>Total</Text>
              </View>
              {group.items.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.colProduct}>{item.productName}</Text>
                  <Text style={styles.colQty}>{item.quantity}</Text>
                  <Text style={styles.colPrice}>{currency(item.unitPrice)}</Text>
                  <Text style={styles.colTotal}>{currency(item.quantity * item.unitPrice)}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{currency(data.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Descuento</Text>
            <Text style={styles.totalValue}>{data.discountPercent}%</Text>
          </View>
          {sortedTaxes.filter((t) => t.enabled).map((tax) => (
            <View key={tax.name} style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                {tax.name} ({tax.rate}%){tax.kind === 'withhold' ? ' — retención' : ''}
              </Text>
              <Text style={styles.totalValue}>
                {tax.kind === 'withhold' ? `−${currency(tax.amount)}` : `+${currency(tax.amount)}`}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.grandTotal}>{currency(data.total)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Fecha de entrega estimada</Text>
          <Text style={styles.value}>{data.estimatedDeliveryDate ?? 'Por confirmar'}</Text>
        </View>
      </Page>
    </Document>
  )
}
