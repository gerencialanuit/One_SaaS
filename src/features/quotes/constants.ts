import type { Locale, TranslationKey } from '@/lib/i18n/translations'
import { t } from '@/lib/i18n/translations'

const QUOTE_STATUS_CLASSNAMES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate',
  sent: 'bg-tint-blue text-brand-blue',
  pending_approval: 'bg-brand-yellow/20 text-[#8A6D00]',
  approved: 'bg-[#038A06]/10 text-[#038A06]',
  rejected: 'bg-red-50 text-red-600',
  expired: 'bg-red-50 text-red-600',
}

export function getQuoteStatusLabel(locale: Locale, status: string): { label: string; className: string } {
  const key = `quotes.status.${status}` as TranslationKey
  return {
    label: t(locale, key),
    className: QUOTE_STATUS_CLASSNAMES[status] ?? QUOTE_STATUS_CLASSNAMES.draft,
  }
}
