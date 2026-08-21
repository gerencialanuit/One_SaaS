'use client'

import { useState } from 'react'
import { createShareLink } from '@/actions/quote-share'

export function ShareQuoteButton({ quoteId }: { quoteId: string }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    setLoading(true)
    setError(null)

    const result = await createShareLink(quoteId)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setShareUrl(`${window.location.origin}/quote/${result.shareToken}`)
    setLoading(false)
  }

  async function handleCopy() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (shareUrl) {
    return (
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={shareUrl}
          className="w-72 rounded-md border border-[#E5E9EF] bg-tint-blue px-3 py-2 text-sm text-navy"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-brand-blue px-4 py-2 text-sm font-medium text-brand-blue transition-colors hover:bg-tint-blue"
        >
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleShare}
        disabled={loading}
        className="rounded-lg border border-brand-blue px-5 py-2.5 font-medium text-brand-blue transition-colors hover:bg-tint-blue disabled:opacity-50"
      >
        {loading ? 'Generando...' : 'Compartir con cliente'}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
