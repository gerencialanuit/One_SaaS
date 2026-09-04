import { AppShell } from '@/shared/components/AppShell'
import { getCurrentProfile } from '@/lib/supabase/profile'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()

  return <AppShell profile={profile}>{children}</AppShell>
}
