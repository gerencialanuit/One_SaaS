import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, IBM_Plex_Sans } from 'next/font/google'
import { getLocale } from '@/lib/i18n/server'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'
import './globals.css'

const heading = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['600', '700'],
})

const body = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'One Automatización | Cotizador',
  description: 'Cotizador agil con visibilidad de inventario para One Automatizacion',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()

  return (
    <html lang={locale} className={`${heading.variable} ${body.variable}`}>
      <body className="bg-[#F7F9FC] font-sans text-navy antialiased">
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  )
}
