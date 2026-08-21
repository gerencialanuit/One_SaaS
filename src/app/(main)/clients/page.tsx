import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'
import { ClientsPageClient } from '@/features/clients/components/ClientsPageClient'

export default async function ClientsPage() {
  const supabase = await createClient()
  const profile = await getCurrentProfile()

  const { data: clients } = await supabase.from('clients').select('*').order('name')

  return (
    <ClientsPageClient
      clients={clients ?? []}
      canCreate={hasRole(profile, 'comercial')}
    />
  )
}
