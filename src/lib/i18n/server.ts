import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, t as translate, type Locale, type TranslationKey } from './translations'

export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return value === 'en' ? 'en' : DEFAULT_LOCALE
}

export async function getTranslator() {
  const locale = await getLocale()
  return {
    locale,
    t: (key: TranslationKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
  }
}
