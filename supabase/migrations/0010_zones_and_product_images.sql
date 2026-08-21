-- Zonas: cada item de una cotizacion puede pertenecer a una zona (ej. "Sala",
-- "Cocina"). Texto libre, no una tabla aparte -- las zonas son ad-hoc por
-- cotizacion, no un catalogo fijo.
alter table public.quote_items add column zone_name text;

-- Foto de producto
alter table public.products add column image_url text;

-- Bucket publico (el cliente ve las fotos en el link compartido y el PDF sin login)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Lectura publica de fotos de producto"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "inventarios y gerente suben fotos de producto"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and public.current_user_role() in ('inventarios', 'gerente'));

create policy "inventarios y gerente actualizan fotos de producto"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and public.current_user_role() in ('inventarios', 'gerente'));

create policy "inventarios y gerente borran fotos de producto"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and public.current_user_role() in ('inventarios', 'gerente'));
