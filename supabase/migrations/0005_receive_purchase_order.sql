-- Fase 3: recibir una orden de compra debe sumar sus items al inventario fisico
-- de forma atomica. SECURITY DEFINER porque el rol 'compras' no tiene permiso
-- de UPDATE sobre 'inventory' (solo 'inventarios' lo tiene) — el chequeo de rol
-- se hace a mano dentro de la funcion, reemplazando el RLS que se bypassea.

create or replace function public.receive_purchase_order(p_purchase_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() <> 'compras' then
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

revoke execute on function public.receive_purchase_order(uuid) from anon, public;
grant execute on function public.receive_purchase_order(uuid) to authenticated;
