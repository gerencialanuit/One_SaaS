'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createQuote } from '@/actions/quotes'
import { createQuoteVersion } from '@/actions/quote-versions'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { ClientFormModal } from '@/features/clients/components/ClientFormModal'
import { computeQuoteEstimate, type IncomingOrder } from '../utils/estimate'
import { computeQuoteTotals, DEFAULT_CABLES_RATE, DEFAULT_LABOR_RATE, DEFAULT_TAX_LINES, type TaxLine } from '../utils/taxes'
import { DEFAULT_INTRO_MESSAGE, DEFAULT_PAYMENT_TERMS, DEFAULT_DELIVERY_TIME_TEXT, DEFAULT_VALIDITY_TEXT, DEFAULT_NOTES } from '../constants'
import { ProductCatalogGrid } from './ProductCatalogGrid'
import { CartPanel, type CartZone } from './CartPanel'
import { TemplatePickerModal } from './TemplatePickerModal'
import { SaveTemplateModal } from './SaveTemplateModal'
import { ZonePickerModal } from './ZonePickerModal'
import type { QuoteProductOption, QuoteTemplateWithItems } from '../types'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

interface ClientOption {
  id: string
  name: string
}

export interface QuoteBuilderEditInitial {
  clientId: string
  projectType: string
  zones: { name: string; items: { product_id: string; quantity: number }[] }[]
  discountEnabled: boolean
  discountPercent: number
  laborEnabled: boolean
  laborPercent: number
  cablesEnabled: boolean
  cablesPercent: number
  taxes: TaxLine[]
  introMessage: string
  paymentTerms: string
  deliveryTimeText: string
  validityText: string
  notes: string
}

export interface QuoteBuilderEditMode {
  quoteId: string
  initial: QuoteBuilderEditInitial
}

interface QuoteBuilderFormProps {
  clients: ClientOption[]
  products: QuoteProductOption[]
  incomingOrders: IncomingOrder[]
  maxDiscountPercent: number
  templates: QuoteTemplateWithItems[]
  currentProfileId: string
  isGerente: boolean
  editMode?: QuoteBuilderEditMode
}

interface Zone {
  id: string
  name: string
  items: Map<string, number>
}

function newZone(index: number): Zone {
  return { id: crypto.randomUUID(), name: `Zona ${index}`, items: new Map() }
}

function zonesFromEditInitial(zones: QuoteBuilderEditInitial['zones']): Zone[] {
  return zones.map((zone) => ({
    id: crypto.randomUUID(),
    name: zone.name,
    items: new Map(zone.items.map((item) => [item.product_id, item.quantity])),
  }))
}

const DEFAULT_TAXES = DEFAULT_TAX_LINES

interface StoredDraft {
  clientId: string
  projectType: string
  zones: { id: string; name: string; items: [string, number][] }[]
  activeZoneId: string | null
  taxes: TaxLine[]
  discountEnabled: boolean
  discountPercent: number
  laborEnabled: boolean
  laborPercent: number
  cablesEnabled: boolean
  cablesPercent: number
  introMessage: string
  paymentTerms: string
  deliveryTimeText: string
  validityText: string
  notes: string
}

function buildDraft(state: {
  clientId: string
  projectType: string
  zones: Zone[]
  activeZoneId: string | null
  taxes: TaxLine[]
  discountEnabled: boolean
  discountPercent: number
  laborEnabled: boolean
  laborPercent: number
  cablesEnabled: boolean
  cablesPercent: number
  introMessage: string
  paymentTerms: string
  deliveryTimeText: string
  validityText: string
  notes: string
}): StoredDraft {
  return {
    clientId: state.clientId,
    projectType: state.projectType,
    zones: state.zones.map((z) => ({ id: z.id, name: z.name, items: Array.from(z.items.entries()) })),
    activeZoneId: state.activeZoneId,
    taxes: state.taxes,
    discountEnabled: state.discountEnabled,
    discountPercent: state.discountPercent,
    laborEnabled: state.laborEnabled,
    laborPercent: state.laborPercent,
    cablesEnabled: state.cablesEnabled,
    cablesPercent: state.cablesPercent,
    introMessage: state.introMessage,
    paymentTerms: state.paymentTerms,
    deliveryTimeText: state.deliveryTimeText,
    validityText: state.validityText,
    notes: state.notes,
  }
}

export function QuoteBuilderForm({
  clients: initialClients,
  products,
  incomingOrders,
  maxDiscountPercent,
  templates,
  currentProfileId,
  isGerente,
  editMode,
}: QuoteBuilderFormProps) {
  const router = useRouter()
  const { t } = useLocale()
  const draftKey = `quoteBuilderDraft:${currentProfileId || 'anon'}`
  const initial = editMode?.initial
  const [clients, setClients] = useState<ClientOption[]>(initialClients)
  const [clientId, setClientId] = useState(initial?.clientId ?? '')
  const [projectType, setProjectType] = useState(initial?.projectType ?? '')
  const [zones, setZones] = useState<Zone[]>(initial ? zonesFromEditInitial(initial.zones) : [])
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null)
  const [taxes, setTaxes] = useState<TaxLine[]>(initial?.taxes && initial.taxes.length > 0 ? initial.taxes : DEFAULT_TAX_LINES)
  const [discountEnabled, setDiscountEnabled] = useState(initial?.discountEnabled ?? false)
  const [discountPercent, setDiscountPercent] = useState(initial?.discountPercent ?? 0)
  const [laborEnabled, setLaborEnabled] = useState(initial?.laborEnabled ?? true)
  const [laborPercent, setLaborPercent] = useState(initial?.laborPercent ?? DEFAULT_LABOR_RATE)
  const [cablesEnabled, setCablesEnabled] = useState(initial?.cablesEnabled ?? true)
  const [cablesPercent, setCablesPercent] = useState(initial?.cablesPercent ?? DEFAULT_CABLES_RATE)
  const [introMessage, setIntroMessage] = useState(initial?.introMessage ?? DEFAULT_INTRO_MESSAGE)
  const [paymentTerms, setPaymentTerms] = useState(initial?.paymentTerms ?? DEFAULT_PAYMENT_TERMS)
  const [deliveryTimeText, setDeliveryTimeText] = useState(initial?.deliveryTimeText ?? DEFAULT_DELIVERY_TIME_TEXT)
  const [validityText, setValidityText] = useState(initial?.validityText ?? DEFAULT_VALIDITY_TEXT)
  const [notes, setNotes] = useState(initial?.notes ?? DEFAULT_NOTES)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [showNewClient, setShowNewClient] = useState(false)
  const [isCartExpanded, setIsCartExpanded] = useState(false)
  const [pendingProductId, setPendingProductId] = useState<string | null>(null)
  // Estado (no ref): un ref queda desincronizado del render que lo lee cuando
  // React vuelve a invocar los efectos (Strict Mode en desarrollo), lo que
  // provocaba que el efecto de guardado sobreescribiera el borrador recien
  // cargado con el estado inicial vacio. Con estado, el efecto de guardado de
  // ese mismo render "ve" siempre isDraftHydrated=false hasta el siguiente
  // render ya con los datos restaurados.
  const [isDraftHydrated, setIsDraftHydrated] = useState(false)
  const [draftJustSaved, setDraftJustSaved] = useState(false)

  useEffect(() => {
    if (editMode) {
      // Editando una cotizacion existente: el estado ya viene sembrado desde
      // `initial`, no del borrador de "nueva cotizacion" en localStorage.
      setIsDraftHydrated(true)
      return
    }
    try {
      const raw = localStorage.getItem(draftKey)
      if (raw) {
        const draft: StoredDraft = JSON.parse(raw)
        setClientId(draft.clientId ?? '')
        setProjectType(draft.projectType ?? '')
        setZones((draft.zones ?? []).map((z) => ({ id: z.id, name: z.name, items: new Map(z.items) })))
        setActiveZoneId(draft.activeZoneId ?? null)
        setTaxes(draft.taxes && draft.taxes.length > 0 ? draft.taxes : DEFAULT_TAXES)
        setDiscountEnabled(!!draft.discountEnabled)
        setDiscountPercent(draft.discountPercent ?? 0)
        setLaborEnabled(draft.laborEnabled ?? true)
        setLaborPercent(draft.laborPercent ?? DEFAULT_LABOR_RATE)
        setCablesEnabled(draft.cablesEnabled ?? true)
        setCablesPercent(draft.cablesPercent ?? DEFAULT_CABLES_RATE)
        setIntroMessage(draft.introMessage ?? DEFAULT_INTRO_MESSAGE)
        setPaymentTerms(draft.paymentTerms ?? DEFAULT_PAYMENT_TERMS)
        setDeliveryTimeText(draft.deliveryTimeText ?? DEFAULT_DELIVERY_TIME_TEXT)
        setValidityText(draft.validityText ?? DEFAULT_VALIDITY_TEXT)
        setNotes(draft.notes ?? DEFAULT_NOTES)
      }
    } catch {
      // borrador corrupto o localStorage no disponible: se ignora y se parte de un carrito vacio
    } finally {
      setIsDraftHydrated(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isDraftHydrated || editMode) return
    try {
      const draft = buildDraft({
        clientId,
        projectType,
        zones,
        activeZoneId,
        taxes,
        discountEnabled,
        discountPercent,
        laborEnabled,
        laborPercent,
        cablesEnabled,
        cablesPercent,
        introMessage,
        paymentTerms,
        deliveryTimeText,
        validityText,
        notes,
      })
      localStorage.setItem(draftKey, JSON.stringify(draft))
    } catch {
      // localStorage no disponible (privado/bloqueado): el borrador simplemente no persiste
    }
  }, [isDraftHydrated, draftKey, clientId, projectType, zones, activeZoneId, taxes, discountEnabled, discountPercent, laborEnabled, laborPercent, cablesEnabled, cablesPercent, introMessage, paymentTerms, deliveryTimeText, validityText, notes])

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const nextArrivalByProduct = useMemo(() => {
    const map = new Map<string, string>()
    for (const order of incomingOrders) {
      const current = map.get(order.productId)
      if (!current || order.expectedArrivalDate < current) {
        map.set(order.productId, order.expectedArrivalDate)
      }
    }
    return map
  }, [incomingOrders])

  const productsWithArrival: QuoteProductOption[] = useMemo(
    () => products.map((p) => ({ ...p, next_arrival_date: nextArrivalByProduct.get(p.id) ?? null })),
    [products, nextArrivalByProduct]
  )

  const productsById = useMemo(() => new Map(productsWithArrival.map((p) => [p.id, p])), [productsWithArrival])

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
  const cartItemCount = useMemo(() => Array.from(cartTotals.values()).reduce((sum, qty) => sum + qty, 0), [cartTotals])

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
        cablesEnabled,
        cablesPercent,
        taxLines: taxes,
      }),
    [subtotal, effectiveDiscountPercent, laborEnabled, laborPercent, cablesEnabled, cablesPercent, taxes]
  )

  function toggleTax(index: number) {
    setTaxes((prev) => prev.map((t, i) => (i === index ? { ...t, enabled: !t.enabled } : t)))
  }

  function changeTaxRate(index: number, rate: number) {
    setTaxes((prev) => prev.map((t, i) => (i === index ? { ...t, rate } : t)))
  }

  function loadTemplate(template: QuoteTemplateWithItems) {
    const zonesByName = new Map<string, Zone>()
    let zoneIndex = 0

    for (const item of template.items) {
      if (!productsById.has(item.product_id)) continue
      const zoneName = item.zone_name || `Zona ${zoneIndex + 1}`
      let zone = zonesByName.get(zoneName)
      if (!zone) {
        zoneIndex += 1
        zone = { id: crypto.randomUUID(), name: zoneName, items: new Map() }
        zonesByName.set(zoneName, zone)
      }
      zone.items.set(item.product_id, (zone.items.get(item.product_id) ?? 0) + item.quantity)
    }

    const newZones = Array.from(zonesByName.values())
    setZones(newZones)
    setActiveZoneId(newZones[0]?.id ?? null)
    setShowTemplatePicker(false)
  }

  function addZone() {
    // El id se genera FUERA del actualizador: en React Strict Mode (dev) la
    // funcion pasada a setZones puede invocarse mas de una vez, y si
    // crypto.randomUUID() se llamara adentro, activeZoneId terminaria
    // apuntando a un id distinto al que realmente quedo en el arreglo.
    const newId = crypto.randomUUID()
    setZones((prev) => [...prev, { id: newId, name: `Zona ${prev.length + 1}`, items: new Map() }])
    setActiveZoneId(newId)
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

  function addProductToZone(productId: string, zoneId: string | null) {
    // resolvedZoneId se decide ANTES de llamar a setZones: la funcion que se
    // le pasa a setZones no corre de inmediato (React la difiere hasta que
    // procesa la actualizacion), asi que mutar una variable "por fuera"
    // dentro de ese callback y leerla justo despues (como se intento antes)
    // siempre lee el valor viejo.
    const targetExists = !!zoneId && zones.some((z) => z.id === zoneId)
    const resolvedZoneId = targetExists ? (zoneId as string) : crypto.randomUUID()

    setZones((prev) => {
      if (targetExists) {
        return prev.map((z) => {
          if (z.id !== resolvedZoneId) return z
          const items = new Map(z.items)
          items.set(productId, (items.get(productId) ?? 0) + 1)
          return { ...z, items }
        })
      }

      const zone: Zone = { id: resolvedZoneId, name: `Zona ${prev.length + 1}`, items: new Map([[productId, 1]]) }
      return [...prev, zone]
    })

    setActiveZoneId(resolvedZoneId)
  }

  function requestAddProduct(productId: string) {
    if (zones.length >= 2) {
      setPendingProductId(productId)
      return
    }
    addProductToZone(productId, activeZoneId)
  }

  function pickZoneForPendingProduct(zoneId: string | null) {
    if (pendingProductId) {
      addProductToZone(pendingProductId, zoneId)
    }
    setPendingProductId(null)
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

  function clearDraft() {
    if (!window.confirm(t('quoteBuilder.clearDraftConfirm'))) return
    setClientId('')
    setProjectType('')
    setZones([])
    setActiveZoneId(null)
    setTaxes(DEFAULT_TAXES)
    setDiscountEnabled(false)
    setDiscountPercent(0)
    setLaborEnabled(true)
    setLaborPercent(DEFAULT_LABOR_RATE)
    setCablesEnabled(true)
    setCablesPercent(DEFAULT_CABLES_RATE)
    setIntroMessage(DEFAULT_INTRO_MESSAGE)
    setPaymentTerms(DEFAULT_PAYMENT_TERMS)
    setDeliveryTimeText(DEFAULT_DELIVERY_TIME_TEXT)
    setValidityText(DEFAULT_VALIDITY_TEXT)
    setNotes(DEFAULT_NOTES)
    try {
      localStorage.removeItem(draftKey)
    } catch {
      // localStorage no disponible: nada que limpiar
    }
  }

  function saveDraftNow() {
    try {
      const draft = buildDraft({
        clientId,
        projectType,
        zones,
        activeZoneId,
        taxes,
        discountEnabled,
        discountPercent,
        laborEnabled,
        laborPercent,
        cablesEnabled,
        cablesPercent,
        introMessage,
        paymentTerms,
        deliveryTimeText,
        validityText,
        notes,
      })
      localStorage.setItem(draftKey, JSON.stringify(draft))
      setDraftJustSaved(true)
      setTimeout(() => setDraftJustSaved(false), 1800)
    } catch {
      // localStorage no disponible: el guardado manual no tiene efecto
    }
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
    formData.set('cables_enabled', String(cablesEnabled))
    formData.set('cables_percent', String(cablesPercent))
    formData.set('intro_message', introMessage)
    formData.set('payment_terms', paymentTerms)
    formData.set('delivery_time_text', deliveryTimeText)
    formData.set('validity_text', validityText)
    formData.set('notes', notes)

    if (editMode) {
      const result = await createQuoteVersion(editMode.quoteId, formData)

      if (result?.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setLoading(false)
      router.push(`/quotes/${editMode.quoteId}`)
      return
    }

    const result = await createQuote(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    try {
      localStorage.removeItem(draftKey)
    } catch {
      // localStorage no disponible: nada que limpiar
    }

    setLoading(false)

    if (result.quoteId && window.confirm(t('quoteBuilder.downloadPdfConfirm'))) {
      window.open(`/quotes/${result.quoteId}/pdf`, '_blank')
    }

    router.push('/quotes')
  }

  return (
    <div className="grid grid-cols-1 gap-6 pb-36 lg:grid-cols-3 lg:pb-0">
      <div className="lg:col-span-2">
        <ProductCatalogGrid products={productsWithArrival} cartTotals={cartTotals} onAdd={requestAddProduct} />
      </div>

      <div>
        <CartPanel
          clients={clients}
          clientId={clientId}
          onClientChange={setClientId}
          onAddClient={() => setShowNewClient(true)}
          onClearDraft={clearDraft}
          onSaveDraft={saveDraftNow}
          draftJustSaved={draftJustSaved}
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
          cablesEnabled={cablesEnabled}
          cablesPercent={cablesPercent}
          onToggleCables={() => setCablesEnabled((prev) => !prev)}
          onChangeCablesPercent={setCablesPercent}
          introMessage={introMessage}
          onChangeIntroMessage={setIntroMessage}
          paymentTerms={paymentTerms}
          onChangePaymentTerms={setPaymentTerms}
          deliveryTimeText={deliveryTimeText}
          onChangeDeliveryTimeText={setDeliveryTimeText}
          validityText={validityText}
          onChangeValidityText={setValidityText}
          notes={notes}
          onChangeNotes={setNotes}
          taxes={taxes}
          totals={totals}
          onToggleTax={toggleTax}
          onChangeTaxRate={changeTaxRate}
          hasItems={hasItems}
          error={error}
          loading={loading}
          onSubmit={handleSubmit}
          onOpenTemplatePicker={() => setShowTemplatePicker(true)}
          onOpenSaveTemplate={() => setShowSaveTemplate(true)}
          isExpanded={isCartExpanded}
          onToggleExpand={() => setIsCartExpanded((prev) => !prev)}
          hideDraftControls={!!editMode}
          submitLabel={editMode ? t('quoteBuilder.saveChanges') : undefined}
          submittingLabel={editMode ? t('quoteBuilder.savingChanges') : undefined}
        />
      </div>

      {hasItems && !isCartExpanded && (
        <button
          type="button"
          onClick={() => setIsCartExpanded(true)}
          className="fixed inset-x-4 bottom-20 z-30 flex items-center justify-between rounded-full bg-brand-blue px-5 py-3 text-white shadow-lg lg:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 002 2M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            {t('quoteBuilder.viewCart')} · {cartItemCount} {t('quoteBuilder.cartItemsHint')}
          </span>
          <span className="font-heading font-semibold">{currency(totals.total)}</span>
        </button>
      )}

      {showTemplatePicker && (
        <TemplatePickerModal
          templates={templates}
          currentProfileId={currentProfileId}
          isGerente={isGerente}
          hasItemsInCart={hasItems}
          onLoad={loadTemplate}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}

      {showSaveTemplate && (
        <SaveTemplateModal
          zones={resolvedZones}
          isGerente={isGerente}
          onClose={() => setShowSaveTemplate(false)}
          onSaved={() => {
            setShowSaveTemplate(false)
            router.refresh()
          }}
        />
      )}

      {pendingProductId && (
        <ZonePickerModal
          zones={zones.map((z) => ({ id: z.id, name: z.name }))}
          onPick={pickZoneForPendingProduct}
          onClose={() => setPendingProductId(null)}
        />
      )}

      {showNewClient && (
        <ClientFormModal
          client={null}
          onClose={() => setShowNewClient(false)}
          onCreated={(newClient) => {
            setClients((prev) => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)))
            setClientId(newClient.id)
          }}
        />
      )}
    </div>
  )
}
