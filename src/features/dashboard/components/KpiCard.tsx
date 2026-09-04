interface KpiCardProps {
  label: string
  value: string
  hint?: string
}

export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-[#E5E9EF] bg-white p-4 shadow-sm sm:p-6">
      <p className="text-sm text-slate">{label}</p>
      <p className="mt-2 font-heading text-xl font-bold text-navy sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-muted">{hint}</p>}
    </div>
  )
}
