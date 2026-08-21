import Link from 'next/link'
import { ForgotPasswordForm } from '@/features/auth/components'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-[#E5E9EF] bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-navy">Recuperar contraseña</h1>
          <p className="mt-2 text-slate">Ingresa tu email para recibir un link de recuperación</p>
        </div>

        <ForgotPasswordForm />

        <p className="text-center text-sm text-slate">
          <Link href="/login" className="font-medium text-brand-blue hover:text-brand-blue-hover hover:underline">
            Volver a ingresar
          </Link>
        </p>
      </div>
    </div>
  )
}
