export const QUOTE_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: 'Borrador', className: 'bg-slate-100 text-slate' },
  sent: { label: 'Enviada', className: 'bg-tint-blue text-brand-blue' },
  pending_approval: { label: 'Pendiente aprobación', className: 'bg-brand-yellow/20 text-[#8A6D00]' },
  approved: { label: 'Aprobada', className: 'bg-[#038A06]/10 text-[#038A06]' },
  rejected: { label: 'Rechazada', className: 'bg-red-50 text-red-600' },
  expired: { label: 'Vencida', className: 'bg-red-50 text-red-600' },
}
