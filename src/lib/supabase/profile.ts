import { createClient } from './server'
import type { Profile, UserRole } from '@/types/database'

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('getCurrentProfile: error fetching profile', error)
    return null
  }

  return data
}

/**
 * El gerente tiene acceso de administrador a todos los modulos ademas de su
 * rol especifico (ver todo, aprobar descuentos). Este helper centraliza esa
 * regla para no repetirla en cada Server Action / pagina.
 */
export function hasRole(profile: Profile | null, ...roles: UserRole[]): boolean {
  if (!profile) return false
  return profile.role === 'gerente' || roles.includes(profile.role)
}
