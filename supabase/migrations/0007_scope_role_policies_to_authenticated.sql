-- Limpieza: las policies que usan current_user_role() no tenian 'to authenticated',
-- por lo que tambien aplicaban a 'anon' (que no tiene EXECUTE sobre esa funcion a
-- proposito) y devolvian error de permisos en vez de simplemente "sin filas".
-- No es una fuga de datos (anon sigue sin poder ver nada), pero es mas correcto
-- que anon reciba un resultado vacio limpio en vez de un error de Postgres.

alter policy "compras administra proveedores" on public.suppliers to authenticated;
alter policy "inventarios administra productos" on public.products to authenticated;
alter policy "inventarios administra stock" on public.inventory to authenticated;
alter policy "compras administra ordenes de compra" on public.purchase_orders to authenticated;
alter policy "compras administra items de ordenes de compra" on public.purchase_order_items to authenticated;
alter policy "gerente ve todos los clientes" on public.clients to authenticated;
alter policy "gerente administra reglas de descuento" on public.discount_rules to authenticated;
alter policy "gerente ve todas las cotizaciones" on public.quotes to authenticated;
alter policy "gerente ve todas las versiones" on public.quote_versions to authenticated;
alter policy "gerente aprueba/rechaza versiones" on public.quote_versions to authenticated;
alter policy "gerente ve todos los items de cotizacion" on public.quote_items to authenticated;
alter policy "gerente ve todas las firmas" on public.quote_signatures to authenticated;
alter policy "gerente ve todas las notificaciones" on public.notifications_log to authenticated;
