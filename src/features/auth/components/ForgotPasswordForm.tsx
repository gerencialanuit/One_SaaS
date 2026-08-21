'use client'

import { useState } from 'react'
import { resetPassword } from '@/actions/auth'

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await resetPassword(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-lg bg-tint-blue px-4 py-3 text-center">
        <p className="text-brand-blue">Revisa tu email para el link de recuperación.</p>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-navy">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full rounded-md border border-[#E5E9EF] bg-white px-4 py-2.5 text-navy placeholder-slate-muted outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar link de recuperación'}
      </button>
    </form>
  )
}
