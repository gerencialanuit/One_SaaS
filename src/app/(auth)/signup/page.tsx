import Link from 'next/link'
import { SignupForm } from '@/features/auth/components'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-[#E5E9EF] bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-navy">Crear cuenta</h1>
          <p className="mt-2 text-slate">Únete a One Automatización</p>
        </div>

        <SignupForm />

        <p className="text-center text-sm text-slate">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-medium text-brand-blue hover:text-brand-blue-hover hover:underline">
            Ingresa
          </Link>
        </p>
      </div>
    </div>
  )
}
