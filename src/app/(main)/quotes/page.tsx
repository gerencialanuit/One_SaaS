import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'
import { QuotesPageClient } from '@/features/quotes/components/QuotesPageClient'
import { getTranslator } from '@/lib/i18n/server'
import type { QuoteWithDetails } from '@/features/quotes/types'

export default async function QuotesPage() {
  const supabase = await createClient()
  const profile = await getCurrentProfile()
  const { t } = await getTranslator()

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, client:clients(*), commercial:profiles(full_name, email), current_version:quote_versions!quotes_current_version_id_fkey(id, total, estimated_delivery_date)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-navy">{t('quotes.title')}</h1>
          <p className="mt-1 text-slate">{t('quotes.subtitle')}</p>
        </div>
        {hasRole(profile, 'comercial') && (
          <Link
            href="/quotes/new"
            className="rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover"
          >
            {t('quotes.new')}
          </Link>
        )}
      </div>

      <div className="mt-6">
        <QuotesPageClient quotes={(quotes as QuoteWithDetails[] | null) ?? []} />
      </div>
    </div>
  )
}
