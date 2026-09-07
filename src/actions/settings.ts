'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/profile'

export async function getDefaultTrm(): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase.from('app_settings').select('value').eq('key', 'trm_usd_cop').single()
  return data?.value ?? 0
}

export async function updateDefaultTrm(rate: number) {
  const profile = await getCurrentProfile()
  if (!profile || !Number.isFinite(rate) || rate <= 0) return

  const supabase = await createClient()
  await supabase
    .from('app_settings')
    .upsert({ key: 'trm_usd_cop', value: rate, updated_at: new Date().toISOString(), updated_by: profile.id })
}
