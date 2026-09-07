'use client'

import { useRef, useState } from 'react'
import { decideSharedQuote } from '@/actions/quote-share'
import { sortTaxesForDisplay } from '../utils/taxes'
import { SignaturePad, type SignaturePadHandle } from './SignaturePad'

interface SharedQuoteItem {
  product_name: string
  product_image_url: string | null
  zone_name: string | null
  quantity: number
  unit_price: number
}

function groupItemsByZone(items: SharedQuoteItem[]): { zoneName: string; items: SharedQuoteItem[] }[] {
  const map = new Map<string, SharedQuoteItem[]>()
  for (const item of items) {
    const key = item.zone_name || 'Sin zona'
    const list = map.get(key)
    if (list) {
      list.push(item)
    } else {
      map.set(key, [item])
    }
  }
  return Array.from(map.entries()).map(([zoneName, zoneItems]) => ({ zoneName, items: zoneItems }))
}

interface SharedQuoteTax {
  name: string
  rate: number
  kind: 'add' | 'withhold'
  enabled: boolean
  amount: number
}

export interface SharedQuoteData {
  quote_id: string
  project_type: string
  client_name: string
  version_number: number
  subtotal: number
  discount_percent: number
  total: number
  estimated_delivery_date: string | null
  decision: 'approved' | 'rejected' | null
  decided_at: string | null
  signer_name: string | null
  items: SharedQuoteItem[]
  taxes: SharedQuoteTax[]
}

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

export function SharedQuoteView({ token, data }: { token: string; data: SharedQuoteData }) {
  const zoneGroups = groupItemsByZone(data.items)
  const signatureRef = useRef<SignaturePadHandle>(null)
  const [signerName, setSignerName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<'approved' | 'rejected' | null>(null)
  const [decided, setDecided] = useState(data.decision)

  async function handleDecision(decision: 'approved' | 'rejected') {
    setError(null)

    if (!signerName.trim()) {
      setError('Escribe tu nombre antes de firmar')
      return
    }

    const signatureData = signatureRef.current?.toDataURL()
    if (!signatureData) {
      setError('Firma en el recuadro antes de continuar')
      return
    }

    setLoading(decision)

    const formData = new FormData()
    formData.set('token', token)
    formData.set('decision', decision)
    formData.set('signerName', signerName)
    formData.set('signatureData', signatureData)

    const result = await decideSharedQuote(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(null)
      return
    }

    setDecided(decision)
    setLoading(null)
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="rounded-lg border border-[#E5E9EF] bg-white p-8 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-one.png" alt="One Automatización" className="h-10 w-auto" />
        <p className="mt-3 text-slate">
          Cotización para {data.client_name} — {data.project_type} (v{data.version_number})
        </p>

        {zoneGroups.map((group) => (
          <div key={group.zoneName} className="mt-6">
            <h3 className="text-sm font-semibold text-brand-blue">{group.zoneName}</h3>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E9EF] text-left text-slate">
                  <th className="py-2 font-medium">Producto</th>
                  <th className="py-2 font-medium">Cant.</th>
                  <th className="py-2 font-medium">Precio unit.</th>
                  <th className="py-2 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item, index) => (
                  <tr key={index} className="border-b border-[#E5E9EF]">
                    <td className="py-2 text-navy">
                      <div className="flex items-center gap-2">
                        {item.product_image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.product_image_url} alt="" className="h-8 w-8 rounded object-cover" />
                        )}
                        {item.product_name}
                      </div>
                    </td>
                    <td className="py-2 text-slate">{item.quantity}</td>
                    <td className="py-2 text-slate">{currency(item.unit_price)}</td>
                    <td className="py-2 text-navy">{currency(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="mt-4 space-y-1 border-t border-[#E5E9EF] pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate">Subtotal</span>
            <span className="text-navy">{currency(data.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate">Descuento</span>
            <span className="text-navy">{data.discount_percent}%</span>
          </div>
          {sortTaxesForDisplay(data.taxes ?? []).filter((t) => t.enabled).map((tax) => (
            <div key={tax.name} className="flex justify-between">
              <span className="text-slate">
                {tax.name} ({tax.rate}%){tax.kind === 'withhold' ? ' — retención' : ''}
              </span>
              <span className={tax.kind === 'withhold' ? 'text-slate' : 'text-navy'}>
                {tax.kind === 'withhold' ? `−${currency(tax.amount)}` : `+${currency(tax.amount)}`}
              </span>
            </div>
          ))}
          <div className="flex justify-between font-heading text-lg font-bold">
            <span className="text-navy">Total</span>
            <span className="text-navy">{currency(data.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate">Entrega estimada</span>
            <span className="text-navy">{data.estimated_delivery_date ?? 'Por confirmar'}</span>
          </div>
        </div>

        <a
          href={`/quote/${token}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-medium text-brand-blue hover:text-brand-blue-hover hover:underline"
        >
          Descargar PDF
        </a>

        <div className="mt-8 border-t border-[#E5E9EF] pt-6">
          {decided ? (
            <div className={`rounded-md px-4 py-3 text-sm font-medium ${decided === 'approved' ? 'bg-[#038A06]/10 text-[#038A06]' : 'bg-red-50 text-red-600'}`}>
              {decided === 'approved' ? 'Cotización aprobada. ¡Gracias!' : 'Cotización rechazada.'}
            </div>
          ) : (
            <>
              <label htmlFor="signerName" className="block text-sm font-medium text-navy">Tu nombre</label>
              <input
                id="signerName"
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#E5E9EF] bg-white px-3 py-2 text-navy outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
              />

              <label className="mt-4 block text-sm font-medium text-navy">Firma</label>
              <div className="mt-1">
                <SignaturePad ref={signatureRef} />
              </div>
              <button
                type="button"
                onClick={() => signatureRef.current?.clear()}
                className="mt-1 text-xs font-medium text-slate hover:text-navy"
              >
                Limpiar firma
              </button>

              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => handleDecision('approved')}
                  className="flex-1 rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover disabled:opacity-50"
                >
                  {loading === 'approved' ? 'Enviando...' : 'Aprobar'}
                </button>
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => handleDecision('rejected')}
                  className="flex-1 rounded-lg border border-[#E5E9EF] px-5 py-2.5 font-medium text-slate transition-colors hover:bg-tint-blue hover:text-navy disabled:opacity-50"
                >
                  {loading === 'rejected' ? 'Enviando...' : 'Rechazar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
