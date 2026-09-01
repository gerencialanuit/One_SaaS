-- Marcas gestionables (ej. Hikvision, Ajax) reemplazando el texto libre en products.brand.
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create unique index brands_name_unique on public.brands (lower(name));

alter table public.brands enable row level security;

create policy "usuarios autenticados leen marcas"
  on public.brands for select
  to authenticated
  using (true);

create policy "inventarios y gerente administran marcas"
  on public.brands for all
  to authenticated
  using (public.current_user_role() in ('inventarios', 'gerente'))
  with check (public.current_user_role() in ('inventarios', 'gerente'));

-- Backfill: una marca por cada valor de texto distinto que ya existia.
insert into public.brands (name)
select distinct brand from public.products where brand is not null and brand <> ''
on conflict do nothing;

alter table public.products add column brand_id uuid references public.brands(id);

update public.products p
set brand_id = b.id
from public.brands b
where lower(b.name) = lower(p.brand);

alter table public.products drop column brand;
