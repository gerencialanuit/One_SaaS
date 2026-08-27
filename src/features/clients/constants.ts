import type { ClientType } from '@/types/database'
import { t, type Locale, type TranslationKey } from '@/lib/i18n/translations'

const CLIENT_TYPE_KEYS: Record<ClientType, TranslationKey> = {
  constructora: 'clients.type.constructora',
  cliente_final: 'clients.type.clienteFinal',
  estudio_diseno: 'clients.type.estudioDiseno',
  arquitecto: 'clients.type.arquitecto',
  administracion_ph: 'clients.type.administracionPh',
  distribuidor: 'clients.type.distribuidor',
  otro: 'clients.type.otro',
}

export const CLIENT_TYPES: ClientType[] = [
  'constructora',
  'cliente_final',
  'estudio_diseno',
  'arquitecto',
  'administracion_ph',
  'distribuidor',
  'otro',
]

export function getClientTypeLabel(locale: Locale, clientType: ClientType): string {
  return t(locale, CLIENT_TYPE_KEYS[clientType])
}
