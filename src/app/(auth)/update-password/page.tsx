import { UpdatePasswordForm } from '@/features/auth/components'

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-[#E5E9EF] bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-navy">Nueva contraseña</h1>
          <p className="mt-2 text-slate">Ingresa tu nueva contraseña</p>
        </div>

        <UpdatePasswordForm />
      </div>
    </div>
  )
}
