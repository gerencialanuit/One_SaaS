import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, IBM_Plex_Sans } from 'next/font/google'
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${heading.variable} ${body.variable}`}>
      <body className="bg-[#F7F9FC] font-sans text-navy antialiased">{children}</body>
    </html>
  )
}
