'use client'

import { useLocale } from '@/lib/i18n/LocaleProvider'
import { useEscapeClose } from '@/shared/hooks/useEscapeClose'

interface ZoneOption {
  id: string
  name: string
}

interface ZonePickerModalProps {
  zones: ZoneOption[]
  onPick: (zoneId: string | null) => void
  onClose: () => void
}

export function ZonePickerModal({ zones, onPick, onClose }: ZonePickerModalProps) {
  const { t } = useLocale()
  useEscapeClose(onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-lg font-semibold text-navy">{t('quoteBuilder.pickZoneTitle')}</h2>

        <div className="mt-4 space-y-2">
          {zones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={() => onPick(zone.id)}
              className="w-full rounded-md border border-[#E5E9EF] px-4 py-2.5 text-left text-sm font-medium text-navy transition-colors hover:border-brand-blue hover:bg-tint-blue"
            >
              {zone.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPick(null)}
            className="w-full rounded-md border border-dashed border-brand-blue px-4 py-2.5 text-left text-sm font-medium text-brand-blue hover:bg-tint-blue"
          >
            {t('quoteBuilder.pickZoneNew')}
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="px-3 py-2 font-medium text-slate hover:text-navy">
            {t('quoteBuilder.pickZoneCancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
