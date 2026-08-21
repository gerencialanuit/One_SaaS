-- ============================================================
-- PRODUCTOS: marca, condicion, moneda del costo
-- ============================================================
alter table public.products add column brand text;
alter table public.products add column condition text not null default 'nuevo'
  check (condition in ('nuevo', 'usado', 'averiado'));
alter table public.products add column currency text not null default 'COP';

-- ============================================================
-- CLIENTES: tipo de cliente
-- ============================================================
alter table public.clients add column client_type text not null default 'cliente_final'
  check (client_type in ('constructora', 'cliente_final', 'estudio_diseno', 'arquitecto', 'administracion_ph', 'distribuidor', 'otro'));

-- ============================================================
-- IMPUESTOS por version de cotizacion
-- ============================================================
create table public.quote_taxes (
  id uuid primary key default gen_random_uuid(),
  quote_version_id uuid references public.quote_versions(id) on delete cascade not null,
  name text not null, -- 'IVA', 'Retencion en la fuente', 'ReteICA', personalizado
  rate numeric(5,2) not null,
  kind text not null check (kind in ('add', 'withhold')), -- add: se suma al total. withhold: informativo, no cambia el total facturado
  enabled boolean not null default true,
  amount numeric(12,2) not null default 0
);

alter table public.quote_taxes enable row level security;

create policy "gerente administra impuestos de cualquier cotizacion"
  on public.quote_taxes for all
  to authenticated
  using (public.current_user_role() = 'gerente')
  with check (public.current_user_role() = 'gerente');

create policy "comercial administra impuestos de sus propias cotizaciones"
  on public.quote_taxes for all
  to authenticated
  using (
    exists (
      select 1 from public.quote_versions qv
      join public.quotes q on q.id = qv.quote_id
      where qv.id = quote_version_id and q.commercial_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.quote_versions qv
      join public.quotes q on q.id = qv.quote_id
      where qv.id = quote_version_id and q.commercial_id = auth.uid()
    )
  );

-- ============================================================
-- PROFILES: lectura amplia de nombre/rol para mostrar "comercial responsable"
-- en listas de cotizaciones (equipo interno, no es dato sensible)
-- ============================================================
create policy "usuarios autenticados leen perfiles del equipo"
  on public.profiles for select
  to authenticated
  using (true);
