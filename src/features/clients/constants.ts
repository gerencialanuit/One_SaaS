import type { ClientType } from '@/types/database'

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  constructora: 'Constructora',
  cliente_final: 'Cliente final',
  estudio_diseno: 'Estudio de diseño',
  arquitecto: 'Arquitecto',
  administracion_ph: 'Administración PH',
  distribuidor: 'Distribuidor',
  otro: 'Otro',
}
