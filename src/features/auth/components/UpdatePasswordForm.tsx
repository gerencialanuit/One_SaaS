'use client'

import { useState } from 'react'
import { updatePassword } from '@/actions/auth'

export function UpdatePasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await updatePassword(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-navy">
          Nueva contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
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
        {loading ? 'Actualizando...' : 'Actualizar contraseña'}
      </button>
    </form>
  )
}
