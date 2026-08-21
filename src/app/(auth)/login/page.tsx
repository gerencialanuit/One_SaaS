import { Suspense } from 'react'
import Link from 'next/link'
import { LoginForm } from '@/features/auth/components'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-[#E5E9EF] bg-white p-8 shadow-sm">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-one.png" alt="One Automatización" className="mx-auto h-12 w-auto" />
          <p className="mt-3 text-slate">Ingresa a tu cuenta</p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-slate">
          ¿No tienes cuenta?{' '}
          <Link href="/signup" className="font-medium text-brand-blue hover:text-brand-blue-hover hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
