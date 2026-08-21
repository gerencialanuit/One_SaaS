'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { login } from '@/actions/auth'
import { GoogleSignInButton } from './GoogleSignInButton'
import { AuthDivider } from './AuthDivider'

export function LoginForm() {
  const searchParams = useSearchParams()
  const oauthError = searchParams.get('error')
  const [error, setError] = useState<string | null>(
    oauthError === 'auth_callback_failed' ? 'Error al iniciar sesión con Google. Intenta de nuevo.' : null
  )
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <GoogleSignInButton />

      <AuthDivider />

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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-navy">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
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
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p className="text-center text-sm text-slate">
          <Link href="/forgot-password" className="text-brand-blue hover:text-brand-blue-hover hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </form>
    </div>
  )
}
