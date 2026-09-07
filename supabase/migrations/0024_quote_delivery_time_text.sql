-- "Tiempo de entrega" (condicion comercial editable, ej. "Según negociación")
-- es distinto de estimated_delivery_date (fecha calculada segun disponibilidad
-- de stock) — faltaba en condiciones comerciales del PDF.

alter table public.quote_versions
  add column delivery_time_text text not null default 'Según negociación';
