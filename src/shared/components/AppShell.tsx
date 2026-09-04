'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { Profile } from '@/types/database'

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 6h17M3.5 12h17M3.5 18h17" />
    </svg>
  )
}

const DESKTOP_BREAKPOINT = '(min-width: 1024px)'

export function AppShell({ profile, children }: { profile: Profile | null; children: React.ReactNode }) {
  const pathname = usePathname()
  const { t } = useLocale()
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Cierra el drawer movil cada vez que la ruta cambia.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const handleOpenMenu = () => {
    const isDesktop = typeof window !== 'undefined' && window.matchMedia(DESKTOP_BREAKPOINT).matches
    if (isDesktop) {
      setDesktopOpen(true)
    } else {
      setMobileOpen(true)
    }
  }

  // Visible en movil siempre; en escritorio solo cuando el sidebar esta colapsado.
  const collapsedBarClasses = desktopOpen
    ? 'flex items-center gap-3 border-b border-[#E5E9EF] bg-white px-4 py-3 lg:hidden'
    : 'flex items-center gap-3 border-b border-[#E5E9EF] bg-white px-4 py-3'

  return (
    <div className="flex min-h-screen bg-[#F7F9FC]">
      <Sidebar
        profile={profile}
        desktopOpen={desktopOpen}
        mobileOpen={mobileOpen}
        onCollapseDesktop={() => setDesktopOpen(false)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {mobileOpen && (
        <button
          type="button"
          aria-label={t('sidebar.closeMenu')}
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className={collapsedBarClasses}>
          <button
            type="button"
            onClick={handleOpenMenu}
            aria-label={t('sidebar.openMenu')}
            className="shrink-0 rounded-md p-1.5 text-slate hover:bg-tint-blue hover:text-navy"
          >
            <MenuIcon />
          </button>
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-one-icon.png" alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
            <span className="truncate font-heading text-sm font-semibold text-navy">One Automatización</span>
          </Link>
        </div>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
