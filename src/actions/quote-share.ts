'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/supabase/profile'

export async function createShareLink(quoteId: string) {
  const profile = await getCurrentProfile()
  if (!profile) {
    return { error: 'No autenticado' }
  }

  const supabase = await createClient()

  const { data: quote } = await supabase.from('quotes').select('id, commercial_id, current_version_id, status').eq('id', quoteId).single()
  if (!quote || quote.commercial_id !== profile.id) {
    return { error: 'No tienes permiso para compartir esta cotización' }
  }
  if (!quote.current_version_id) {
    return { error: 'La cotización no tiene una versión válida' }
  }

  const { data: existing } = await supabase
    .from('quote_signatures')
    .select('share_token')
    .eq('quote_version_id', quote.current_version_id)
    .maybeSingle()

  if (existing) {
    return { success: true, shareToken: existing.share_token }
  }

  const { data: signature, error } = await supabase
    .from('quote_signatures')
    .insert({ quote_version_id: quote.current_version_id })
    .select('share_token')
    .single()

  if (error || !signature) {
    return { error: error?.message ?? 'No se pudo generar el link' }
  }

  if (quote.status === 'draft') {
    await supabase.from('quotes').update({ status: 'sent' }).eq('id', quoteId)
  }

  revalidatePath(`/quotes/${quoteId}`)
  return { success: true, shareToken: signature.share_token }
}

const decisionSchema = z.object({
  token: z.string().trim().min(1),
  decision: z.enum(['approved', 'rejected']),
  signerName: z.string().trim().min(1, 'Tu nombre es requerido'),
  signatureData: z.string().trim().min(1, 'La firma es requerida'),
})

export async function decideSharedQuote(formData: FormData) {
  const parsed = decisionSchema.safeParse({
    token: formData.get('token'),
    decision: formData.get('decision'),
    signerName: formData.get('signerName'),
    signatureData: formData.get('signatureData'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const headersList = await headers()
  const signerIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null

  const { error } = await supabase.rpc('decide_shared_quote', {
    p_token: parsed.data.token,
    p_decision: parsed.data.decision,
    p_signature_data: parsed.data.signatureData,
    p_signer_name: parsed.data.signerName,
    p_signer_ip: signerIp,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
