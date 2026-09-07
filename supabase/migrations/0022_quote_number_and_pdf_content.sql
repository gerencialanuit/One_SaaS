-- Consecutivo legible de cotizacion (COT-<year>-<seq>) + campos de contenido
-- del PDF (mensaje de introduccion, condiciones comerciales, nota) con
-- valores predeterminados editables por version. Tambien ciudad del cliente,
-- usada en el encabezado del nuevo formato de cotizacion.

alter table public.clients add column city text;

create sequence public.quote_number_seq start with 1;

alter table public.quotes add column quote_number text;

-- security definer: el consecutivo debe asignarse sin depender de que el rol
-- que inserta (comercial) tenga privilegios directos sobre la secuencia.
create or replace function public.assign_quote_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.quote_number is null then
    new.quote_number := 'COT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.quote_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger set_quote_number
before insert on public.quotes
for each row execute function public.assign_quote_number();

-- Backfill de cotizaciones existentes, en orden de creacion, antes de exigir NOT NULL.
do $$
declare
  r record;
begin
  for r in select id, created_at from public.quotes where quote_number is null order by created_at loop
    update public.quotes
    set quote_number = 'COT-' || to_char(r.created_at, 'YYYY') || '-' || lpad(nextval('public.quote_number_seq')::text, 4, '0')
    where id = r.id;
  end loop;
end $$;

alter table public.quotes alter column quote_number set not null;
alter table public.quotes add constraint quotes_quote_number_key unique (quote_number);

alter table public.quote_versions
  add column intro_message text not null default 'Atendiendo a su amable solicitud, nos permitimos enviar la siguiente cotización de control de automatización, con su respectiva descripción y precios:',
  add column payment_terms text not null default '50% anticipo · 50% contra entrega',
  add column validity_text text not null default '30 días calendario',
  add column notes text not null default 'Esta cotización no incluye obra civil ni acabados.';
