'use client'

import { useState } from 'react'
import Link from 'next/link'
import { VersionHistoryList } from './VersionHistoryList'
import { QuoteEditModal } from './QuoteEditModal'
import { ApprovalPanel } from './ApprovalPanel'
import { ShareQuoteButton } from './ShareQuoteButton'
import { getQuoteStatusLabel } from '../constants'
import { groupByZone } from '../utils/group-by-zone'
import { sortTaxesForDisplay } from '../utils/taxes'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import type { QuoteDetailData, QuoteProductOption } from '../types'
import type { QuoteVersion } from '@/types/database'
import type { IncomingOrder } from '../utils/estimate'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

interface QuoteDetailClientProps {
  quote: QuoteDetailData
  currentVersion: QuoteVersion | null
  products: QuoteProductOption[]
  incomingOrders: IncomingOrder[]
  canEdit: boolean
  canApprove: boolean
  maxDiscountPercent: number
}

export function QuoteDetailClient({
  quote,
  currentVersion,
  products,
  incomingOrders,
  canEdit,
  canApprove,
  maxDiscountPercent,
}: QuoteDetailClientProps) {
  const [showEdit, setShowEdit] = useState(false)
  const { t, locale } = useLocale()
  const status = getQuoteStatusLabel(locale, quote.status)
  const zoneGroups = groupByZone(quote.currentItems)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link
        href="/quotes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate transition-colors hover:text-navy"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12.5 15L7.5 10L12.5 5" />
        </svg>
        {t('quoteDetail.backToList')}
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-medium text-slate-muted">{quote.quote_number}</p>
          <h1 className="font-heading text-3xl font-bold text-navy">{quote.client?.name ?? t('quoteDetail.fallbackTitle')}</h1>
          <p className="mt-1 text-slate">{quote.project_type}</p>
          <p className="mt-0.5 text-xs text-slate-muted">{t('quoteDetail.responsible')} {quote.commercial?.full_name || quote.commercial?.email || '—'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
          <a
            href={`/quotes/${quote.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[#E5E9EF] px-4 py-2.5 font-medium text-slate transition-colors hover:bg-tint-blue hover:text-navy"
          >
            {t('quoteDetail.downloadPdf')}
          </a>
          {canEdit && quote.status === 'draft' && (
            <Link
              href={`/quotes/${quote.id}/edit`}
              className="rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover"
            >
              {t('quoteDetail.edit')}
            </Link>
          )}
          {canEdit && quote.status !== 'draft' && (
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              className="rounded-lg bg-brand-blue px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-blue-hover"
            >
              {t('quoteDetail.edit')}
            </button>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="mt-4">
          <ShareQuoteButton quoteId={quote.id} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {canApprove && currentVersion && (
            <ApprovalPanel quoteId={quote.id} quoteVersionId={currentVersion.id} discountPercent={currentVersion.discount_percent} />
          )}

          <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-navy">{t('quoteDetail.productsVersion')}</h2>
            {zoneGroups.map((group) => {
              const zoneTotal = group.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
              return (
                <div key={group.zoneName} className="mt-4">
                  <h3 className="text-sm font-semibold text-brand-blue">{group.zoneName}</h3>
                  <div className="overflow-x-auto">
                    <table className="mt-2 w-full min-w-[480px] text-sm">
                      <thead>
                        <tr className="border-b border-[#E5E9EF] text-left text-slate">
                          <th className="py-2 font-medium">{t('quoteDetail.table.product')}</th>
                          <th className="py-2 font-medium">{t('quoteDetail.table.quantity')}</th>
                          <th className="py-2 font-medium">{t('quoteDetail.table.unitPrice')}</th>
                          <th className="py-2 font-medium">{t('quoteDetail.table.subtotal')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item) => (
                          <tr key={item.id} className="border-b border-[#E5E9EF]">
                            <td className="py-2 text-navy">{item.product?.name ?? '—'}</td>
                            <td className="py-2 text-slate">{item.quantity}</td>
                            <td className="py-2 text-slate">{currency(item.unit_price)}</td>
                            <td className="py-2 text-navy">{currency(item.quantity * item.unit_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-1 text-right text-xs font-medium text-slate">
                    {t('quoteDetail.zoneSubtotal', { zone: group.zoneName })} {currency(zoneTotal)}
                  </div>
                </div>
              )
            })}

            {currentVersion && (
              <div className="mt-4 space-y-1 border-t border-[#E5E9EF] pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate">{t('quoteBuilder.subtotal')}</span>
                  <span className="text-navy">{currency(currentVersion.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate">{t('quoteBuilder.discount')}</span>
                  <span className="text-navy">{currentVersion.discount_percent}%</span>
                </div>
                {sortTaxesForDisplay(quote.currentTaxes).filter((tax) => tax.enabled).map((tax) => (
                  <div key={tax.id} className="flex justify-between">
                    <span className="text-slate">
                      {tax.name} ({tax.rate}%){tax.kind === 'withhold' ? ` — ${t('quoteBuilder.retention')}` : ''}
                    </span>
                    <span className={tax.kind === 'withhold' ? 'text-slate' : 'text-navy'}>
                      {tax.kind === 'withhold' ? `−${currency(tax.amount)}` : `+${currency(tax.amount)}`}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-heading text-lg font-bold">
                  <span className="text-navy">{t('quoteDetail.total')}</span>
                  <span className="text-navy">{currency(currentVersion.total)}</span>
                </div>
                {quote.currentTaxes.some((tax) => tax.kind === 'withhold' && tax.enabled) && (
                  <p className="text-xs text-slate-muted">{t('quoteDetail.withholdingNote')}</p>
                )}
                <div className="flex justify-between">
                  <span className="text-slate">{t('quoteBuilder.estimatedDelivery')}</span>
                  <span className="text-navy">{currentVersion.estimated_delivery_date ?? t('quoteBuilder.noDate')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <VersionHistoryList versions={quote.versions} currentVersionId={quote.current_version_id} />
        </div>
      </div>

      {showEdit && currentVersion && (
        <QuoteEditModal
          quoteId={quote.id}
          products={products}
          incomingOrders={incomingOrders}
          currentItems={quote.currentItems}
          currentTaxes={quote.currentTaxes}
          currentDiscountPercent={currentVersion.discount_percent}
          maxDiscountPercent={maxDiscountPercent}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}
