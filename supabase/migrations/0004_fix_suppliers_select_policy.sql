-- Fase 2: inventarios necesita leer proveedores para el selector al crear un producto.
-- Se amplia la lectura a todos los autenticados, igual que products/inventory/purchase_orders
-- (las mutaciones siguen restringidas a 'compras').

drop policy "compras y gerente pueden ver proveedores" on public.suppliers;

create policy "usuarios autenticados leen proveedores"
  on public.suppliers for select
  to authenticated
  using (true);
