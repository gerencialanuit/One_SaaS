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

// Contenido predeterminado del PDF de cotizacion — precargado en el
// formulario y como default de columna en la BD; editable por cotizacion.
export const DEFAULT_INTRO_MESSAGE =
  'Atendiendo a su amable solicitud, nos permitimos enviar la siguiente cotización de control de automatización, con su respectiva descripción y precios:'
export const DEFAULT_PAYMENT_TERMS = '50% anticipo · 50% contra entrega'
export const DEFAULT_DELIVERY_TIME_TEXT = '45 días hábiles desde el anticipo'
export const DEFAULT_VALIDITY_TEXT = '30 días calendario'
export const DEFAULT_NOTES = 'Esta cotización no incluye obra civil ni acabados.'
