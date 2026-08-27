-- Modelo de abastecimiento del producto: si se maneja con stock/inventario
-- propio (umbral de stock bajo aplica) o si es bajo pedido (se consigue solo
-- cuando lo piden, nunca se mantiene en bodega).
alter table public.products
  add column supply_model text not null default 'inventario'
  check (supply_model in ('inventario', 'bajo_pedido'));
