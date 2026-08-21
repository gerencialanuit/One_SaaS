'use client'

import { useState } from 'react'
import { approveQuoteVersion } from '@/actions/quote-versions'

interface ApprovalPanelProps {
  quoteId: string
  quoteVersionId: string
  discountPercent: number
}

export function ApprovalPanel({ quoteId, quoteVersionId, discountPercent }: ApprovalPanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApprove() {
    setLoading(true)
    setError(null)
    const result = await approveQuoteVersion(quoteVersionId, quoteId)
    if (result?.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="rounded-lg border border-brand-yellow/40 bg-tint-yellow p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-navy">Aprobación de descuento pendiente</h2>
      <p className="mt-1 text-sm text-slate">
        Esta versión tiene un descuento de {discountPercent}% que excede el límite del comercial.
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleApprove}
        disabled={loading}
        className="mt-3 rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover disabled:opacity-50"
      >
        {loading ? 'Aprobando...' : 'Aprobar descuento'}
      </button>
    </div>
  )
}
