-- Atributos personalizados reutilizables (ej. Voltaje, Color, Resolucion) que se
-- pueden asignar con un valor especifico a cualquier producto, sin tocar codigo.
create table public.product_attributes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create unique index product_attributes_name_unique on public.product_attributes (lower(name));

create table public.product_attribute_values (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  attribute_id uuid references public.product_attributes(id) on delete cascade not null,
  value text not null,
  unique (product_id, attribute_id)
);

alter table public.product_attributes enable row level security;
alter table public.product_attribute_values enable row level security;

create policy "usuarios autenticados leen atributos"
  on public.product_attributes for select
  to authenticated
  using (true);

create policy "inventarios y gerente administran atributos"
  on public.product_attributes for all
  to authenticated
  using (public.current_user_role() in ('inventarios', 'gerente'))
  with check (public.current_user_role() in ('inventarios', 'gerente'));

create policy "usuarios autenticados leen valores de atributos"
  on public.product_attribute_values for select
  to authenticated
  using (true);

create policy "inventarios y gerente administran valores de atributos"
  on public.product_attribute_values for all
  to authenticated
  using (public.current_user_role() in ('inventarios', 'gerente'))
  with check (public.current_user_role() in ('inventarios', 'gerente'));
