-- Categorias jerarquicas (padre/hijo) reemplazando el texto libre en products.category.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Nombre unico entre hermanos (y entre categorias raiz), sin distinguir mayus/minus.
create unique index categories_top_level_name_unique on public.categories (lower(name)) where parent_id is null;
create unique index categories_child_name_unique on public.categories (parent_id, lower(name)) where parent_id is not null;

alter table public.categories enable row level security;

create policy "usuarios autenticados leen categorias"
  on public.categories for select
  to authenticated
  using (true);

create policy "inventarios y gerente administran categorias"
  on public.categories for all
  to authenticated
  using (public.current_user_role() in ('inventarios', 'gerente'))
  with check (public.current_user_role() in ('inventarios', 'gerente'));

-- Backfill: una categoria raiz por cada valor de texto distinto que ya existia.
insert into public.categories (name)
select distinct category from public.products
on conflict do nothing;

alter table public.products add column category_id uuid references public.categories(id);

update public.products p
set category_id = c.id
from public.categories c
where c.parent_id is null and lower(c.name) = lower(p.category);

alter table public.products alter column category_id set not null;
alter table public.products drop column category;
