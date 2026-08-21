'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createQuote } from '@/actions/quotes'
import { computeQuoteEstimate, type IncomingOrder } from '../utils/estimate'
import { computeQuoteTotals, DEFAULT_LABOR_RATE, DEFAULT_TAX_LINES, type TaxLine } from '../utils/taxes'
import { ProductCatalogGrid } from './ProductCatalogGrid'
import { CartPanel, type CartZone } from './CartPanel'
import type { QuoteProductOption } from '../types'

interface ClientOption {
  id: string
  name: string
}

interface QuoteBuilderFormProps {
  clients: ClientOption[]
  products: QuoteProductOption[]
  incomingOrders: IncomingOrder[]
  maxDiscountPercent: number
}

interface Zone {
  id: string
  name: string
  items: Map<string, number>
}

function newZone(index: number): Zone {
  return { id: crypto.randomUUID(), name: `Zona ${index}`, items: new Map() }
}

export function QuoteBuilderForm({ clients, products, incomingOrders, maxDiscountPercent }: QuoteBuilderFormProps) {
  const router = useRouter()
  const [clientId, setClientId] = useState('')
  const [projectType, setProjectType] = useState('')
  const [zones, setZones] = useState<Zone[]>([])
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null)
  const [taxes, setTaxes] = useState<TaxLine[]>(DEFAULT_TAX_LINES)
  const [discountEnabled, setDiscountEnabled] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [laborEnabled, setLaborEnabled] = useState(false)
  const [laborPercent, setLaborPercent] = useState(DEFAULT_LABOR_RATE)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const resolvedZones: CartZone[] = useMemo(
    () =>
      zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        items: Array.from(zone.items.entries())
          .map(([productId, quantity]) => {
            const product = productsById.get(productId)
            return product ? { product, quantity } : null
          })
          .filter((x): x is { product: QuoteProductOption; quantity: number } => x !== null),
      })),
    [zones, productsById]
  )

  const cartTotals = useMemo(() => {
    const totals = new Map<string, number>()
    for (const zone of zones) {
      for (const [productId, quantity] of zone.items) {
        totals.set(productId, (totals.get(productId) ?? 0) + quantity)
      }
    }
    return totals
  }, [zones])

  const hasItems = useMemo(() => Array.from(cartTotals.values()).some((qty) => qty > 0), [cartTotals])

  const subtotal = useMemo(() => {
    let sum = 0
    for (const [productId, quantity] of cartTotals) {
      sum += (productsById.get(productId)?.unit_price ?? 0) * quantity
    }
    return sum
  }, [cartTotals, productsById])

  const availability = useMemo(
    () => products.map((p) => ({ productId: p.id, unitPrice: p.unit_price, availableWithQuotes: p.available_with_quotes })),
    [products]
  )

  const estimate = useMemo(() => {
    if (!hasItems) return null
    const mergedItems = Array.from(cartTotals.entries()).map(([productId, quantity]) => ({ productId, quantity }))
    return computeQuoteEstimate(mergedItems, availability, incomingOrders, today)
  }, [hasItems, cartTotals, availability, incomingOrders, today])

  const effectiveDiscountPercent = discountEnabled ? discountPercent : 0
  const discountExceedsLimit = discountEnabled && discountPercent > maxDiscountPercent
  const totals = useMemo(
    () =>
      computeQuoteTotals({
        subtotal,
        discountPercent: effectiveDiscountPercent,
        laborEnabled,
        laborPercent,
        taxLines: taxes,
      }),
    [subtotal, effectiveDiscountPercent, laborEnabled, laborPercent, taxes]
  )

  function toggleTax(index: number) {
    setTaxes((prev) => prev.map((t, i) => (i === index ? { ...t, enabled: !t.enabled } : t)))
  }

  function changeTaxRate(index: number, rate: number) {
    setTaxes((prev) => prev.map((t, i) => (i === index ? { ...t, rate } : t)))
  }

  function addZone() {
    setZones((prev) => {
      const zone = newZone(prev.length + 1)
      setActiveZoneId(zone.id)
      return [...prev, zone]
    })
  }

  function renameZone(zoneId: string, name: string) {
    setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, name } : z)))
  }

  function removeZone(zoneId: string) {
    setZones((prev) => {
      const next = prev.filter((z) => z.id !== zoneId)
      if (activeZoneId === zoneId) {
        setActiveZoneId(next[0]?.id ?? null)
      }
      return next
    })
  }

  function addToActiveZone(productId: string) {
    setZones((prev) => {
      let targetId = activeZoneId
      let next = prev

      if (!targetId || !prev.some((z) => z.id === targetId)) {
        const zone = newZone(prev.length + 1)
        next = [...prev, zone]
        targetId = zone.id
        setActiveZoneId(zone.id)
      }

      return next.map((z) => {
        if (z.id !== targetId) return z
        const items = new Map(z.items)
        items.set(productId, (items.get(productId) ?? 0) + 1)
        return { ...z, items }
      })
    })
  }

  function incrementItem(zoneId: string, productId: string) {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== zoneId) return z
        const items = new Map(z.items)
        items.set(productId, (items.get(productId) ?? 0) + 1)
        return { ...z, items }
      })
    )
  }

  function decrementItem(zoneId: string, productId: string) {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== zoneId) return z
        const items = new Map(z.items)
        const current = items.get(productId) ?? 0
        if (current <= 1) {
          items.delete(productId)
        } else {
          items.set(productId, current - 1)
        }
        return { ...z, items }
      })
    )
  }

  function removeItem(zoneId: string, productId: string) {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== zoneId) return z
        const items = new Map(z.items)
        items.delete(productId)
        return { ...z, items }
      })
    )
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const items = zones.flatMap((zone) =>
      Array.from(zone.items.entries()).map(([product_id, quantity]) => ({
        product_id,
        quantity,
        zone_name: zone.name,
      }))
    )
    formData.set('items', JSON.stringify(items))
    formData.set('taxes', JSON.stringify(taxes))
    formData.set('discount_percent', String(effectiveDiscountPercent))
    formData.set('labor_enabled', String(laborEnabled))
    formData.set('labor_percent', String(laborPercent))

    const result = await createQuote(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setLoading(false)
    router.push('/quotes')
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <ProductCatalogGrid products={products} cartTotals={cartTotals} onAdd={addToActiveZone} />
      </div>

      <div>
        <CartPanel
          clients={clients}
          clientId={clientId}
          onClientChange={setClientId}
          projectType={projectType}
          onProjectTypeChange={setProjectType}
          zones={resolvedZones}
          activeZoneId={activeZoneId}
          onSetActiveZone={setActiveZoneId}
          onAddZone={addZone}
          onRenameZone={renameZone}
          onRemoveZone={removeZone}
          onIncrement={incrementItem}
          onDecrement={decrementItem}
          onRemoveItem={removeItem}
          estimate={estimate}
          subtotal={subtotal}
          discountEnabled={discountEnabled}
          discountPercent={discountPercent}
          onToggleDiscount={() => setDiscountEnabled((prev) => !prev)}
          onChangeDiscountPercent={setDiscountPercent}
          maxDiscountPercent={maxDiscountPercent}
          discountExceedsLimit={discountExceedsLimit}
          laborEnabled={laborEnabled}
          laborPercent={laborPercent}
          onToggleLabor={() => setLaborEnabled((prev) => !prev)}
          onChangeLaborPercent={setLaborPercent}
          taxes={taxes}
          totals={totals}
          onToggleTax={toggleTax}
          onChangeTaxRate={changeTaxRate}
          hasItems={hasItems}
          error={error}
          loading={loading}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
