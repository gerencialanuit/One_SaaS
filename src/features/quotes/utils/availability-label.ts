import { t, type Locale } from '@/lib/i18n/translations'
import type { ProductSupplyModel } from '@/types/database'

export type AvailabilityTone = 'ok' | 'low' | 'warn' | 'alert' | 'info'

export interface AvailabilityLabel {
  label: string
  tone: AvailabilityTone
}

/**
 * Cuando hay stock disponible, se muestra la cantidad (con aviso si esta baja).
 * Cuando NO hay stock disponible, el mensaje depende del modelo del producto:
 * - Bajo pedido: nunca se maneja en bodega, siempre se consigue por encargo.
 * - Inventario: si hay una orden de compra pendiente, la fecha planeada de
 *   llegada; si no hay ninguna, "Sin OC" (sin orden de compra en camino).
 */
export function getAvailabilityLabel(
  available: number,
  supplyModel: ProductSupplyModel,
  nextArrivalDate: string | null | undefined,
  locale: Locale
): AvailabilityLabel {
  if (available > 0) {
    return {
      label: t(locale, 'quoteBuilder.availabilityDisp', { n: available }),
      tone: available < 5 ? 'low' : 'ok',
    }
  }

  if (supplyModel === 'bajo_pedido') {
    return { label: t(locale, 'quoteBuilder.madeToOrder'), tone: 'info' }
  }

  if (nextArrivalDate) {
    return { label: t(locale, 'quoteBuilder.arrivesOn', { date: nextArrivalDate }), tone: 'warn' }
  }

  return { label: t(locale, 'quoteBuilder.noPo'), tone: 'alert' }
}
