-- El gerente ahora tambien puede CREAR/EDITAR en todos los modulos, no solo
-- ver y aprobar descuentos (equipo chico, el dueno/gerente opera todo al inicio).

drop policy "inventarios administra productos" on public.products;
create policy "inventarios y gerente administran productos"
  on public.products for all
  to authenticated
  using (public.current_user_role() in ('inventarios', 'gerente'))
  with check (public.current_user_role() in ('inventarios', 'gerente'));

drop policy "inventarios administra stock" on public.inventory;
create policy "inventarios y gerente administran stock"
  on public.inventory for all
  to authenticated
  using (public.current_user_role() in ('inventarios', 'gerente'))
  with check (public.current_user_role() in ('inventarios', 'gerente'));

drop policy "compras administra proveedores" on public.suppliers;
create policy "compras y gerente administran proveedores"
  on public.suppliers for all
  to authenticated
  using (public.current_user_role() in ('compras', 'gerente'))
  with check (public.current_user_role() in ('compras', 'gerente'));

drop policy "compras administra ordenes de compra" on public.purchase_orders;
create policy "compras y gerente administran ordenes de compra"
  on public.purchase_orders for all
  to authenticated
  using (public.current_user_role() in ('compras', 'gerente'))
  with check (public.current_user_role() in ('compras', 'gerente'));

drop policy "compras administra items de ordenes de compra" on public.purchase_order_items;
create policy "compras y gerente administran items de ordenes de compra"
  on public.purchase_order_items for all
  to authenticated
  using (public.current_user_role() in ('compras', 'gerente'))
  with check (public.current_user_role() in ('compras', 'gerente'));

-- Cotizaciones: el gerente puede crear/editar cualquier cotizacion, no solo
-- aprobar descuentos. Se agrega ademas de la policy de dueno existente.
create policy "gerente administra todas las cotizaciones"
  on public.quotes for all
  to authenticated
  using (public.current_user_role() = 'gerente')
  with check (public.current_user_role() = 'gerente');

create policy "gerente crea/edita versiones de cualquier cotizacion"
  on public.quote_versions for all
  to authenticated
  using (public.current_user_role() = 'gerente')
  with check (public.current_user_role() = 'gerente');

create policy "gerente administra items de cualquier cotizacion"
  on public.quote_items for all
  to authenticated
  using (public.current_user_role() = 'gerente')
  with check (public.current_user_role() = 'gerente');

-- receive_purchase_order(): permitir tambien a gerente
create or replace function public.receive_purchase_order(p_purchase_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() not in ('compras', 'gerente') then
    raise exception 'No tienes permiso para recibir ordenes de compra';
  end if;

  update public.purchase_orders
  set status = 'received'
  where id = p_purchase_order_id
    and status not in ('received', 'cancelled');

  if not found then
    raise exception 'Orden de compra no encontrada, ya recibida o cancelada';
  end if;

  update public.inventory i
  set quantity_on_hand = i.quantity_on_hand + poi.quantity,
      updated_at = now()
  from public.purchase_order_items poi
  where poi.purchase_order_id = p_purchase_order_id
    and i.product_id = poi.product_id;
end;
$$;
