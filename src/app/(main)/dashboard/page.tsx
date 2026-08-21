import { getCurrentProfile, hasRole } from '@/lib/supabase/profile'
import { getDashboardData } from '@/features/dashboard/services/getDashboardData'
import { computeDashboardKpis } from '@/features/dashboard/utils/compute-kpis'
import { KpiCard } from '@/features/dashboard/components/KpiCard'
import { StatusBreakdownList } from '@/features/dashboard/components/StatusBreakdownList'
import { PendingApprovalsList } from '@/features/dashboard/components/PendingApprovalsList'
import { HotQuotesList } from '@/features/dashboard/components/HotQuotesList'
import { LowStockList } from '@/features/dashboard/components/LowStockList'
import { UpcomingArrivalsList } from '@/features/dashboard/components/UpcomingArrivalsList'
import { InventoryValueChart } from '@/features/dashboard/components/InventoryValueChart'
import { TopClientsList } from '@/features/dashboard/components/TopClientsList'

const currency = (value: number) => `$${Math.round(value).toLocaleString('es-CO')}`
const percent = (value: number | null) => (value === null ? '—' : `${Math.round(value * 100)}%`)
const days = (value: number | null) => (value === null ? '—' : `${value.toFixed(1)} días`)

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  const data = await getDashboardData()
  const kpis = computeDashboardKpis(data.quotes)

  const showSalesSection = hasRole(profile, 'comercial')
  const showApprovals = profile?.role === 'gerente'
  const showInventorySection = hasRole(profile, 'inventarios')
  const showPurchasingSection = hasRole(profile, 'compras')

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl font-bold text-navy">Dashboard</h1>
      <p className="mt-1 text-slate">Resumen de la operación</p>

      {showSalesSection && (
        <>
          <div className="mt-6 grid grid-cols-4 gap-6">
            <KpiCard label="Pipeline activo" value={currency(kpis.pipelineValue)} hint={`${kpis.activeCount} cotizaciones`} />
            <KpiCard label="Tasa de conversión" value={percent(kpis.conversionRate)} hint="Aprobadas vs. decididas" />
            <KpiCard label="Tiempo promedio de cierre" value={days(kpis.avgDaysToClose)} />
            <KpiCard label="Aprobaciones pendientes" value={String(data.pendingApprovals.length)} />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {showApprovals && <PendingApprovalsList quotes={data.pendingApprovals} />}
              <StatusBreakdownList breakdown={kpis.statusBreakdown} />
              <TopClientsList clients={data.topClients} />
            </div>
            <div>
              <HotQuotesList quotes={data.hotQuotes} />
            </div>
          </div>
        </>
      )}

      {(showInventorySection || showPurchasingSection) && (
        <div className="mt-6 grid grid-cols-2 gap-6">
          {showInventorySection && <LowStockList products={data.lowStockProducts} />}
          {showPurchasingSection && <UpcomingArrivalsList arrivals={data.upcomingArrivals} />}
        </div>
      )}

      {showInventorySection && (
        <div className="mt-6">
          <InventoryValueChart data={data.inventoryValueByCategory} />
        </div>
      )}
    </div>
  )
}
