export interface QuoteKpiInput {
  status: string
  total: number
  createdAt: string
  updatedAt: string
}

export interface StatusBreakdownEntry {
  status: string
  count: number
  total: number
}

export interface DashboardKpis {
  pipelineValue: number
  activeCount: number
  conversionRate: number | null
  avgDaysToClose: number | null
  statusBreakdown: StatusBreakdownEntry[]
}

const ACTIVE_STATUSES = ['draft', 'sent', 'pending_approval']
const MS_PER_DAY = 1000 * 60 * 60 * 24

export function computeDashboardKpis(quotes: QuoteKpiInput[]): DashboardKpis {
  const active = quotes.filter((q) => ACTIVE_STATUSES.includes(q.status))
  const pipelineValue = active.reduce((sum, q) => sum + q.total, 0)

  const approved = quotes.filter((q) => q.status === 'approved')
  const rejected = quotes.filter((q) => q.status === 'rejected')
  const decidedCount = approved.length + rejected.length
  const conversionRate = decidedCount > 0 ? approved.length / decidedCount : null

  const closed = [...approved, ...rejected]
  const avgDaysToClose =
    closed.length > 0
      ? closed.reduce((sum, q) => {
          const days = (new Date(q.updatedAt).getTime() - new Date(q.createdAt).getTime()) / MS_PER_DAY
          return sum + Math.max(days, 0)
        }, 0) / closed.length
      : null

  const statusMap = new Map<string, StatusBreakdownEntry>()
  for (const q of quotes) {
    const entry = statusMap.get(q.status) ?? { status: q.status, count: 0, total: 0 }
    entry.count += 1
    entry.total += q.total
    statusMap.set(q.status, entry)
  }

  return {
    pipelineValue,
    activeCount: active.length,
    conversionRate,
    avgDaysToClose,
    statusBreakdown: Array.from(statusMap.values()),
  }
}
