-- El valor predeterminado de "tiempo de entrega" pasa de "Según negociación"
-- a "45 días hábiles desde el anticipo" (el que definimos en el formato).

alter table public.quote_versions
  alter column delivery_time_text set default '45 días hábiles desde el anticipo';
