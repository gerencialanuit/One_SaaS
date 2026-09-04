'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signout } from '@/actions/auth'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { LanguageToggle } from './LanguageToggle'
import type { TranslationKey } from '@/lib/i18n/translations'
import type { Profile } from '@/types/database'

interface NavChild {
  href: string
  labelKey: TranslationKey
}

interface NavItem {
  href: string
  labelKey: TranslationKey
  icon: React.ReactNode
  adminOnly?: boolean
  children?: NavChild[]
}

const PRIMARY_NAV: NavItem[] = [
  {
    href: '/dashboard',
    labelKey: 'sidebar.dashboard',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h7v9H3V3zm11 0h7v5h-7V3zm0 9h7v9h-7v-9zM3 16h7v5H3v-5z" />
    ),
  },
  {
    href: '/quotes',
    labelKey: 'sidebar.quotes',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zM13 3v5h5M9 13h6M9 17h6M9 9h2"
      />
    ),
  },
  {
    href: '/products',
    labelKey: 'sidebar.products',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8" />
    ),
  },
  {
    href: '/purchase-orders',
    labelKey: 'sidebar.purchaseOrders',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7h11v8H3V7zm11 3h4l3 3v2h-7v-5zM6.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm11 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
      />
    ),
  },
  {
    href: '/clients',
    labelKey: 'sidebar.clients',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
      />
    ),
  },
]

// Nada que administrar todavia (sin paginas de configuracion / equipo /
// integraciones). El array queda listo para crecer: cada item soporta
// `adminOnly` y `children` sin tocar el resto del componente.
const SECONDARY_NAV: NavItem[] = []

const LOGOUT_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
  />
)

function ChevronDownIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className={`h-4 w-4 shrink-0 transition-transform duration-150 ${className}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

/** pathname === href, o pathname es una sub-ruta de href (nunca por prefijo suelto). */
function matchesRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Entre el item y sus hijos, devuelve el href MAS LARGO que matchea la ruta activa. */
function getActiveHref(pathname: string, item: NavItem): string | null {
  const candidates = [item.href, ...(item.children?.map((c) => c.href) ?? [])].filter((href) =>
    matchesRoute(pathname, href)
  )
  if (candidates.length === 0) return null
  return candidates.reduce((longest, href) => (href.length > longest.length ? href : longest))
}

interface SidebarProps {
  profile: Profile | null
  desktopOpen: boolean
  mobileOpen: boolean
  onCollapseDesktop: () => void
  onCloseMobile: () => void
}

export function Sidebar({ profile, desktopOpen, mobileOpen, onCollapseDesktop, onCloseMobile }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useLocale()
  const [expandedHrefs, setExpandedHrefs] = useState<Set<string>>(new Set())

  const isAdmin = profile?.role === 'gerente'
  const allItems = [...PRIMARY_NAV, ...SECONDARY_NAV]

  // Auto-expande el grupo que contiene la ruta activa.
  useEffect(() => {
    const toExpand = allItems.filter((item) => item.children?.some((child) => matchesRoute(pathname, child.href)))
    if (toExpand.length === 0) return
    setExpandedHrefs((prev) => {
      const next = new Set(prev)
      toExpand.forEach((item) => next.add(item.href))
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const toggleExpanded = (href: string) => {
    setExpandedHrefs((prev) => {
      const next = new Set(prev)
      if (next.has(href)) {
        next.delete(href)
      } else {
        next.add(href)
      }
      return next
    })
  }

  const visibleSecondary = SECONDARY_NAV.filter((item) => !item.adminOnly || isAdmin)

  const renderItem = (item: NavItem) => {
    const activeHref = getActiveHref(pathname, item)
    const isActive = activeHref === item.href
    const hasChildren = !!item.children?.length
    const isExpanded = expandedHrefs.has(item.href)
    const label = t(item.labelKey)

    return (
      <div key={item.href}>
        <div
          className={
            isActive
              ? 'flex items-center gap-1 rounded-lg bg-brand-blue-dark text-white'
              : 'flex items-center gap-1 rounded-lg text-slate transition-colors hover:bg-tint-blue hover:text-navy'
          }
        >
          <Link href={item.href} className="flex min-w-0 flex-1 items-center gap-3 px-2.5 py-2.5 font-medium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5 shrink-0">
              {item.icon}
            </svg>
            <span className="truncate whitespace-nowrap">{label}</span>
          </Link>
          {hasChildren && (
            <button
              type="button"
              onClick={() => toggleExpanded(item.href)}
              aria-label={t('sidebar.toggleSection')}
              aria-expanded={isExpanded}
              className="mr-1.5 shrink-0 rounded-md p-1.5 hover:bg-black/5"
            >
              <ChevronDownIcon className={isExpanded ? 'rotate-180' : ''} />
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-[1.15rem] mt-1 space-y-1 border-l border-[#E5E9EF] pl-4">
            {item.children!.map((child) => {
              const isChildActive = activeHref === child.href
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={
                    isChildActive
                      ? 'block rounded-lg bg-brand-blue-dark px-2.5 py-2 text-sm font-medium text-white'
                      : 'block rounded-lg px-2.5 py-2 text-sm text-slate transition-colors hover:bg-tint-blue hover:text-navy'
                  }
                >
                  {t(child.labelKey)}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const initial = (profile?.full_name?.trim()?.[0] ?? profile?.email?.[0] ?? '?').toUpperCase()

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col overflow-hidden border-r border-[#E5E9EF] bg-white transition-transform duration-200 ease-in-out',
        'lg:static lg:z-auto lg:translate-x-0',
        mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full',
        desktopOpen ? 'lg:w-60' : 'lg:w-0 lg:border-r-0',
      ].join(' ')}
    >
      <div className="flex h-[76px] w-60 shrink-0 items-center gap-2.5 overflow-hidden border-b border-[#E5E9EF] px-4">
        <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-one-icon.png" alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          <span className="truncate font-heading text-sm font-semibold text-navy">One Automatización</span>
        </Link>
        <button
          type="button"
          onClick={onCollapseDesktop}
          aria-label={t('sidebar.collapseSidebar')}
          className="hidden shrink-0 rounded-md p-1.5 text-slate hover:bg-tint-blue hover:text-navy lg:inline-flex"
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label={t('sidebar.closeMenu')}
          className="shrink-0 rounded-md p-1.5 text-slate hover:bg-tint-blue hover:text-navy lg:hidden"
        >
          <XIcon />
        </button>
      </div>

      <nav className="w-60 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {PRIMARY_NAV.map(renderItem)}

        {visibleSecondary.length > 0 && (
          <>
            <div className="my-3 border-t border-[#E5E9EF]" />
            {visibleSecondary.map(renderItem)}
          </>
        )}
      </nav>

      <div className="w-60 border-t border-[#E5E9EF] p-3">
        <LanguageToggle expanded />
      </div>

      <div className="w-60 border-t border-[#E5E9EF] p-3">
        <div className="flex items-center gap-3 px-1 py-1.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue text-sm font-semibold text-white">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-navy">{profile?.full_name || profile?.email || '—'}</p>
            <p className="truncate text-xs text-slate-muted">{profile?.email ?? ''}</p>
          </div>
        </div>
        <form action={signout}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium text-slate hover:bg-tint-blue hover:text-navy"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5 shrink-0">
              {LOGOUT_ICON}
            </svg>
            <span>{t('sidebar.logout')}</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
