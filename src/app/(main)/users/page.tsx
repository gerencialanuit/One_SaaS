import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'
import { UsersPageClient } from '@/features/users/components/UsersPageClient'

export default async function UsersPage() {
  const profile = await getCurrentProfile()
  if (!profile || !hasRole(profile, 'gerente')) {
    redirect('/dashboard')
  }

  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, full_name, cargo, commercial_email, role')
    .order('full_name')

  return <UsersPageClient users={users ?? []} currentUserId={profile.id} />
}
