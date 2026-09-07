import type { UserRole } from '@/types/database'

export interface UserRow {
  id: string
  email: string
  full_name: string | null
  cargo: string | null
  commercial_email: string | null
  role: UserRole
}
