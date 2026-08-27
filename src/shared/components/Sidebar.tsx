'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signout } from '@/actions/auth'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { LanguageToggle } from './LanguageToggle'
import type { TranslationKey } from '@/lib/i18n/translations'

const NAV_ITEMS: { href: string; labelKey: TranslationKey; icon: React.ReactNode }[] = [
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"
      />
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

const LOGOUT_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
  />
)

export function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const { t } = useLocale()

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden border-r border-[#E5E9EF] bg-white transition-[width] duration-200 ease-in-out ${
        expanded ? 'w-64 shadow-lg' : 'w-16'
      }`}
    >
      <div className="flex h-[76px] shrink-0 items-center justify-center overflow-hidden border-b border-[#E5E9EF] px-4">
        {expanded ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo-one.png" alt="One Automatización" className="h-12 w-auto" />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-blue text-sm font-bold text-white">
            OA
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const label = t(item.labelKey)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={label}
              className={
                isActive
                  ? 'flex items-center gap-3 rounded-lg bg-brand-blue-dark px-2.5 py-2.5 font-medium text-white'
                  : 'flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-slate transition-colors hover:bg-tint-blue hover:text-navy'
              }
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5 shrink-0">
                {item.icon}
              </svg>
              <span className={`whitespace-nowrap transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[#E5E9EF] p-3">
        <LanguageToggle expanded={expanded} />
      </div>

      <form action={signout} className="border-t border-[#E5E9EF] p-3">
        <button
          type="submit"
          title={t('sidebar.logout')}
          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium text-slate hover:bg-tint-blue hover:text-navy"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5 shrink-0">
            {LOGOUT_ICON}
          </svg>
          <span className={`whitespace-nowrap transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
            {t('sidebar.logout')}
          </span>
        </button>
      </form>
    </aside>
  )
}
