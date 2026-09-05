'use client'

import Link from 'next/link'
import { useLocale } from '@/lib/i18n/LocaleProvider'

export function NewQuoteFab() {
  const { t } = useLocale()

  return (
    <Link
      href="/quotes/new"
      aria-label={t('dashboard.newQuoteFab')}
      title={t('dashboard.newQuoteFab')}
      className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-lg transition-transform hover:bg-brand-blue-hover active:scale-95 lg:hidden"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 002 2M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
      </svg>
    </Link>
  )
}
