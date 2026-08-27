'use client'

import { useLocale } from '@/lib/i18n/LocaleProvider'

interface LanguageToggleProps {
  expanded: boolean
}

const GLOBE_ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a14.5 14.5 0 010 18M12 3a14.5 14.5 0 000 18"
  />
)

export function LanguageToggle({ expanded }: LanguageToggleProps) {
  const { locale, setLocale, t } = useLocale()

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
      title={t('sidebar.language')}
      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium text-slate hover:bg-tint-blue hover:text-navy"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5 shrink-0">
        {GLOBE_ICON}
      </svg>
      <span className={`whitespace-nowrap transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
        {locale === 'es' ? 'Español (ES)' : 'English (EN)'}
      </span>
    </button>
  )
}
