import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-[#E5E9EF] bg-white p-8 text-center shadow-sm">
        <h1 className="font-heading text-3xl font-bold text-navy">Revisa tu email</h1>
        <p className="text-slate">
          Te enviamos un link de confirmación. Revisa tu correo para completar el registro.
        </p>
        <Link href="/login" className="inline-block font-medium text-brand-blue hover:text-brand-blue-hover hover:underline">
          Volver a ingresar
        </Link>
      </div>
    </div>
  )
}
