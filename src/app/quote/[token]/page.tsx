import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SharedQuoteView, type SharedQuoteData } from '@/features/quotes/components/SharedQuoteView'

export default async function SharedQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data } = await supabase.rpc('get_shared_quote', { p_token: token })

  if (!data) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <SharedQuoteView token={token} data={data as SharedQuoteData} />
    </div>
  )
}
