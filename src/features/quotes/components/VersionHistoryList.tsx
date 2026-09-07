import type { QuoteVersion } from '@/types/database'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { SharePdfButton } from './SharePdfButton'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

function formatDateTime(isoDate: string) {
  return new Date(isoDate).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface VersionHistoryListProps {
  quoteId: string
  versions: QuoteVersion[]
  currentVersionId: string | null
  selectedVersionId: string | null
  onSelectVersion: (versionId: string) => void
}

export function VersionHistoryList({
  quoteId,
  versions,
  currentVersionId,
  selectedVersionId,
  onSelectVersion,
}: VersionHistoryListProps) {
  const { t } = useLocale()
  const sorted = [...versions].sort((a, b) => b.version_number - a.version_number)

  return (
    <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-navy">{t('quoteDetail.versionHistory')}</h2>
      <ul className="mt-3 space-y-3">
        {sorted.map((version) => {
          const isCurrent = version.id === currentVersionId
          const isSelected = version.id === selectedVersionId
          return (
            <li key={version.id}>
              <button
                type="button"
                onClick={() => onSelectVersion(version.id)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  isSelected ? 'border-brand-blue bg-tint-blue' : 'border-[#E5E9EF] hover:border-brand-blue/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-navy">
                    v{version.version_number}
                    {isCurrent && (
                      <span className="rounded-full bg-brand-blue px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {t('quoteDetail.currentVersion')}
                      </span>
                    )}
                  </span>
                  <span className="text-navy">{currency(version.total)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate">
                  <span>{t('quoteBuilder.discount')}: {version.discount_percent}%</span>
                  <span>{version.estimated_delivery_date ?? t('quoteBuilder.noDate')}</span>
                </div>
                <div className="mt-1 text-xs text-slate-muted">
                  {t('quoteDetail.createdAt')} {formatDateTime(version.created_at)}
                </div>
                {version.requires_approval && (
                  <div className="mt-1 text-xs font-medium">
                    {version.approved_by ? (
                      <span className="text-[#038A06]">{t('quoteDetail.approvedByManager')}</span>
                    ) : (
                      <span className="text-[#8A6D00]">{t('quoteDetail.pendingApproval')}</span>
                    )}
                  </div>
                )}
              </button>
              <div className="mt-1 flex flex-wrap items-center gap-3" onClick={(e) => e.stopPropagation()}>
                {/* Mismo patron que arriba: Ver PDF (visor, solo escritorio) +
                    Compartir/Guardar (Web Share, funciona tambien en la PWA). */}
                <a
                  href={`/quotes/${quoteId}/pdf?versionId=${version.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden text-xs font-medium text-brand-blue hover:text-brand-blue-hover hover:underline lg:inline-block"
                >
                  {t('quoteDetail.viewPdf')}
                </a>
                <SharePdfButton
                  url={`/quotes/${quoteId}/pdf?versionId=${version.id}`}
                  filename={`cotizacion-v${version.version_number}.pdf`}
                  label={t('quoteDetail.sharePdf')}
                  loadingLabel={t('quoteDetail.pdfGenerating')}
                  tapAgainLabel={t('quoteDetail.pdfTapAgain')}
                  errorLabel={t('quoteDetail.pdfError')}
                  className="text-xs font-medium text-brand-blue hover:text-brand-blue-hover hover:underline disabled:opacity-50"
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
