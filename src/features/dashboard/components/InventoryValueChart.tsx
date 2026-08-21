import type { InventoryValueByCategory } from '../types'

const currency = (value: number) => `$${Math.round(value).toLocaleString('es-CO')}`

const PALETTE = ['#F15523', '#001B40', '#FFC414', '#44536B', '#038A06', '#8A6D00', '#64748B', '#B23A16']

interface Slice {
  category: string
  value: number
  percent: number
  color: string
  dashOffset: number
  dashLength: number
}

function buildSlices(data: InventoryValueByCategory[]): { slices: Slice[]; total: number } {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total <= 0) return { slices: [], total: 0 }

  const circumference = 2 * Math.PI * 15.9155
  let cursor = 0
  const slices = data.map((d, i) => {
    const percent = d.value / total
    const dashLength = percent * circumference
    const slice: Slice = {
      category: d.category,
      value: d.value,
      percent,
      color: PALETTE[i % PALETTE.length],
      dashOffset: cursor,
      dashLength,
    }
    cursor += dashLength
    return slice
  })

  return { slices, total }
}

export function InventoryValueChart({ data }: { data: InventoryValueByCategory[] }) {
  const { slices, total } = buildSlices(data)

  return (
    <div className="rounded-lg border border-[#E5E9EF] bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-navy">Valor de inventario por categoría</h2>

      {slices.length === 0 ? (
        <p className="mt-4 text-sm text-slate">Sin inventario valorado todavía.</p>
      ) : (
        <div className="mt-4 flex items-center gap-8">
          <div className="relative h-40 w-40 shrink-0">
            <svg viewBox="0 0 36 36" className="h-40 w-40 -rotate-90">
              {slices.map((slice) => (
                <circle
                  key={slice.category}
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="6"
                  strokeDasharray={`${slice.dashLength} ${2 * Math.PI * 15.9155 - slice.dashLength}`}
                  strokeDashoffset={-slice.dashOffset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-muted">Total</span>
              <span className="text-sm font-bold text-navy">{currency(total)}</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {slices.map((slice) => (
              <div key={slice.category} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                  <span className="truncate text-slate">{slice.category}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-medium text-navy">{currency(slice.value)}</span>
                  <span className="w-10 text-right text-xs text-slate-muted">{Math.round(slice.percent * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
