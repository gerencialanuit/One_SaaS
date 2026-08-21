-- Fase 1 del PRP: Fundacion de datos del cotizador
-- Precondicion: 0001_create_profiles_with_roles.sql ya debe estar aplicada (public.profiles, public.user_role)
-- Ejecutar en: Supabase Dashboard > SQL Editor (proyecto gwsbczppcdiotzehlptb)

-- Helper: rol del usuario autenticado actual (evita recursion de RLS sobre profiles)
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- CATALOGO
-- ============================================================

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  created_at timestamptz default now() not null
);

alter table public.suppliers enable row level security;

create policy "compras y gerente pueden ver proveedores"
  on public.suppliers for select
  using (public.current_user_role() in ('compras', 'gerente'));

create policy "compras administra proveedores"
  on public.suppliers for all
  using (public.current_user_role() = 'compras')
  with check (public.current_user_role() = 'compras');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null,
  category text not null, -- camaras, sensores, automatizacion, etc.
  supplier_id uuid references public.suppliers(id),
  unit_price numeric(12,2) not null,
  unit_cost numeric(12,2),
  low_stock_threshold integer not null default 5,
  is_active boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.products enable row level security;

create policy "usuarios autenticados leen el catalogo"
  on public.products for select
  to authenticated
  using (true);

create policy "inventarios administra productos"
  on public.products for all
  using (public.current_user_role() = 'inventarios')
  with check (public.current_user_role() = 'inventarios');

create table public.inventory (
  product_id uuid primary key references public.products(id) on delete cascade,
  quantity_on_hand integer not null default 0, -- stock fisico real
  updated_at timestamptz default now() not null,
  updated_by uuid references public.profiles(id)
);

alter table public.inventory enable row level security;

create policy "usuarios autenticados leen inventario"
  on public.inventory for select
  to authenticated
  using (true);

create policy "inventarios administra stock"
  on public.inventory for all
  using (public.current_user_role() = 'inventarios')
  with check (public.current_user_role() = 'inventarios');

-- ============================================================
-- COMPRAS
-- ============================================================

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) not null,
  status text not null default 'pending' check (status in ('pending', 'partial', 'received', 'cancelled')),
  expected_arrival_date date not null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null
);

alter table public.purchase_orders enable row level security;

create policy "usuarios autenticados leen ordenes de compra"
  on public.purchase_orders for select
  to authenticated
  using (true);

create policy "compras administra ordenes de compra"
  on public.purchase_orders for all
  using (public.current_user_role() = 'compras')
  with check (public.current_user_role() = 'compras');

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid references public.purchase_orders(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12,2)
);

alter table public.purchase_order_items enable row level security;

create policy "usuarios autenticados leen items de ordenes de compra"
  on public.purchase_order_items for select
  to authenticated
  using (true);

create policy "compras administra items de ordenes de compra"
  on public.purchase_order_items for all
  using (public.current_user_role() = 'compras')
  with check (public.current_user_role() = 'compras');

-- ============================================================
-- CLIENTES
-- ============================================================

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text,
  email text,
  address text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now() not null
);

alter table public.clients enable row level security;

create policy "gerente ve todos los clientes"
  on public.clients for select
  using (public.current_user_role() = 'gerente');

create policy "comercial administra sus propios clientes"
  on public.clients for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- ============================================================
-- REGLAS DE DESCUENTO
-- ============================================================

create table public.discount_rules (
  role public.user_role primary key,
  max_discount_percent numeric(5,2) not null default 0
);

alter table public.discount_rules enable row level security;

create policy "usuarios autenticados leen reglas de descuento"
  on public.discount_rules for select
  to authenticated
  using (true);

create policy "gerente administra reglas de descuento"
  on public.discount_rules for all
  using (public.current_user_role() = 'gerente')
  with check (public.current_user_role() = 'gerente');

insert into public.discount_rules (role, max_discount_percent) values
  ('comercial', 5),
  ('inventarios', 0),
  ('compras', 0),
  ('gerente', 100);

-- ============================================================
-- COTIZACIONES (versionadas)
-- ============================================================

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) not null,
  commercial_id uuid references public.profiles(id) not null,
  project_type text not null, -- camaras, sensores, automatizacion, etc.
  status text not null default 'draft' check (status in ('draft', 'sent', 'pending_approval', 'approved', 'rejected', 'expired')),
  current_version_id uuid, -- FK agregada abajo con ALTER TABLE (referencia circular con quote_versions)
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.quotes enable row level security;

create policy "gerente ve todas las cotizaciones"
  on public.quotes for select
  using (public.current_user_role() = 'gerente');

create policy "comercial administra sus propias cotizaciones"
  on public.quotes for all
  using (commercial_id = auth.uid())
  with check (commercial_id = auth.uid());

create table public.quote_versions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade not null,
  version_number integer not null,
  subtotal numeric(12,2) not null,
  discount_percent numeric(5,2) not null default 0,
  total numeric(12,2) not null,
  estimated_delivery_date date,
  requires_approval boolean not null default false,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null,
  unique (quote_id, version_number)
);

-- Ahora que quote_versions existe, cerramos la referencia circular
alter table public.quotes
  add constraint quotes_current_version_id_fkey
  foreign key (current_version_id) references public.quote_versions(id);

alter table public.quote_versions enable row level security;

create policy "gerente ve todas las versiones"
  on public.quote_versions for select
  using (public.current_user_role() = 'gerente');

create policy "comercial ve/crea versiones de sus propias cotizaciones"
  on public.quote_versions for select
  using (
    exists (select 1 from public.quotes q where q.id = quote_id and q.commercial_id = auth.uid())
  );

create policy "comercial crea versiones de sus propias cotizaciones"
  on public.quote_versions for insert
  with check (
    exists (select 1 from public.quotes q where q.id = quote_id and q.commercial_id = auth.uid())
  );

create policy "gerente aprueba/rechaza versiones"
  on public.quote_versions for update
  using (public.current_user_role() = 'gerente')
  with check (public.current_user_role() = 'gerente');

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_version_id uuid references public.quote_versions(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null
);

alter table public.quote_items enable row level security;

create policy "gerente ve todos los items de cotizacion"
  on public.quote_items for select
  using (public.current_user_role() = 'gerente');

create policy "comercial administra items de sus propias cotizaciones"
  on public.quote_items for all
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

-- Vista: Disponibilidad con Cotizaciones (campo separado del stock fisico)
-- available_with_quotes = quantity_on_hand - comprometido en cotizaciones activas
-- security_invoker: aplica el RLS del usuario que consulta, no del dueño de la vista
-- (creada aqui porque depende de quotes/quote_versions/quote_items, definidas arriba)
create view public.inventory_availability
with (security_invoker = true)
as
select
  i.product_id,
  i.quantity_on_hand,
  coalesce(committed.qty, 0) as committed_in_quotes,
  i.quantity_on_hand - coalesce(committed.qty, 0) as available_with_quotes
from public.inventory i
left join (
  select qi.product_id, sum(qi.quantity) as qty
  from public.quote_items qi
  join public.quote_versions qv on qv.id = qi.quote_version_id
  join public.quotes q on q.id = qv.quote_id and q.current_version_id = qv.id
  where q.status in ('draft', 'sent', 'pending_approval')
  group by qi.product_id
) committed on committed.product_id = i.product_id;

-- ============================================================
-- COMPARTIR + FIRMA
-- ============================================================

create table public.quote_signatures (
  id uuid primary key default gen_random_uuid(),
  quote_version_id uuid references public.quote_versions(id) not null,
  share_token uuid not null default gen_random_uuid(), -- usado en el link publico
  viewed_at timestamptz,
  decision text check (decision in ('approved', 'rejected')),
  signature_data text, -- base64 de la firma capturada
  signer_name text,
  signer_ip text,
  decided_at timestamptz,
  created_at timestamptz default now() not null
);

alter table public.quote_signatures enable row level security;

create unique index quote_signatures_share_token_idx on public.quote_signatures(share_token);

create policy "gerente ve todas las firmas"
  on public.quote_signatures for select
  using (public.current_user_role() = 'gerente');

create policy "comercial ve firmas de sus propias cotizaciones"
  on public.quote_signatures for select
  using (
    exists (
      select 1 from public.quote_versions qv
      join public.quotes q on q.id = qv.quote_id
      where qv.id = quote_version_id and q.commercial_id = auth.uid()
    )
  );

create policy "comercial crea firmas para sus propias cotizaciones"
  on public.quote_signatures for insert
  with check (
    exists (
      select 1 from public.quote_versions qv
      join public.quotes q on q.id = qv.quote_id
      where qv.id = quote_version_id and q.commercial_id = auth.uid()
    )
  );

-- NOTA (Fase 7 - quote-sharing): el cliente accede al link publico SIN login,
-- por eso esta tabla NO tiene policy de SELECT publico/anon (evitar listar filas
-- via REST: GET /quote_signatures?select=* expondria todos los tokens).
-- La Fase 7 debe implementar una funcion RPC 'security definer' que reciba el
-- share_token exacto como parametro y devuelva solo esa fila (y los datos de la
-- cotizacion asociada), nunca una policy 'using (true)' sobre la tabla completa.

-- ============================================================
-- NOTIFICACIONES
-- ============================================================

create table public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) not null,
  channel text not null check (channel in ('whatsapp', 'email')),
  recipient text not null,
  event text not null check (event in ('quote_sent', 'quote_viewed', 'quote_approved', 'quote_rejected')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  created_at timestamptz default now() not null
);

alter table public.notifications_log enable row level security;

create policy "gerente ve todas las notificaciones"
  on public.notifications_log for select
  using (public.current_user_role() = 'gerente');

create policy "comercial ve/crea notificaciones de sus propias cotizaciones"
  on public.notifications_log for all
  using (
    exists (select 1 from public.quotes q where q.id = quote_id and q.commercial_id = auth.uid())
  )
  with check (
    exists (select 1 from public.quotes q where q.id = quote_id and q.commercial_id = auth.uid())
  );
