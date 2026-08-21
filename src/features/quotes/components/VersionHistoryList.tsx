import type { QuoteVersion } from '@/types/database'

const currency = (value: number) => `$${value.toLocaleString('es-CO')}`

interface VersionHistoryListProps {
  versions: QuoteVersion[]
  currentVersionId: string | null
}

export function VersionHistoryList({ versions, currentVersionId }: VersionHistoryListProps) {
  const sorted = [...versions].sort((a, b) => b.version_number - a.version_number)

  return (
    <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-navy">Historial de versiones</h2>
      <ul className="mt-3 space-y-3">
        {sorted.map((version) => {
          const isCurrent = version.id === currentVersionId
          return (
            <li
              key={version.id}
              className={`rounded-md border px-3 py-2 text-sm ${isCurrent ? 'border-brand-blue bg-tint-blue' : 'border-[#E5E9EF]'}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-navy">v{version.version_number}</span>
                <span className="text-navy">{currency(version.total)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate">
                <span>Descuento: {version.discount_percent}%</span>
                <span>{version.estimated_delivery_date ?? 'Sin fecha'}</span>
              </div>
              {version.requires_approval && (
                <div className="mt-1 text-xs font-medium">
                  {version.approved_by ? (
                    <span className="text-[#038A06]">Aprobada por gerencia</span>
                  ) : (
                    <span className="text-[#8A6D00]">Pendiente de aprobación</span>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
