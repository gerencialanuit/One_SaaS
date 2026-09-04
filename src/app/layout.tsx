import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, IBM_Plex_Sans } from 'next/font/google'
import { getLocale } from '@/lib/i18n/server'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'
import { PWARegister } from '@/shared/components/PWARegister'
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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'One',
  },
  icons: {
    icon: [
      { url: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#F15523',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()

  return (
    <html lang={locale} className={`${heading.variable} ${body.variable}`}>
      <head>
        {/* Next solo emite "mobile-web-app-capable"; iOS < 16.4 necesita el prefijo "apple-". */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-[#F7F9FC] font-sans text-navy antialiased">
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
        <PWARegister />
      </body>
    </html>
  )
}
