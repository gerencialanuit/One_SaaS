import type { UserRole } from '@/types/database'
import { t, type Locale, type TranslationKey } from '@/lib/i18n/translations'

const ROLE_KEYS: Record<UserRole, TranslationKey> = {
  gerente: 'users.role.gerente',
  comercial: 'users.role.comercial',
  inventarios: 'users.role.inventarios',
  compras: 'users.role.compras',
}

export const USER_ROLES: UserRole[] = ['gerente', 'comercial', 'inventarios', 'compras']

export function getRoleLabel(locale: Locale, role: UserRole): string {
  return t(locale, ROLE_KEYS[role])
}
