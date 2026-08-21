-- Plantillas de cotizacion: kits reutilizables de productos/zonas/cantidades
-- para cotizar rapido cuando piden lo mismo de siempre. NO guardan cliente ni
-- tipo de proyecto (eso siempre cambia); solo el contenido del carrito.
-- Compartidas: solo el gerente puede crearlas, y todo el equipo las ve.
-- Privadas: cualquier comercial crea las suyas, solo el (y el gerente) las ve.

create table public.quote_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_shared boolean not null default false,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz not null default now()
);

alter table public.quote_templates enable row level security;

create policy "gerente administra todas las plantillas"
  on public.quote_templates for all
  to authenticated
  using (public.current_user_role() = 'gerente')
  with check (public.current_user_role() = 'gerente');

create policy "comercial ve plantillas propias y compartidas"
  on public.quote_templates for select
  to authenticated
  using (created_by = auth.uid() or is_shared = true);

create policy "comercial crea sus propias plantillas privadas"
  on public.quote_templates for insert
  to authenticated
  with check (created_by = auth.uid() and is_shared = false);

create policy "comercial edita sus propias plantillas"
  on public.quote_templates for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid() and is_shared = false);

create policy "comercial elimina sus propias plantillas"
  on public.quote_templates for delete
  to authenticated
  using (created_by = auth.uid());

create table public.quote_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.quote_templates(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null check (quantity > 0),
  zone_name text
);

alter table public.quote_template_items enable row level security;

create policy "gerente administra items de cualquier plantilla"
  on public.quote_template_items for all
  to authenticated
  using (public.current_user_role() = 'gerente')
  with check (public.current_user_role() = 'gerente');

create policy "ver items de plantillas visibles"
  on public.quote_template_items for select
  to authenticated
  using (
    exists (
      select 1 from public.quote_templates t
      where t.id = template_id
        and (t.created_by = auth.uid() or t.is_shared = true)
    )
  );

create policy "administrar items de plantillas propias"
  on public.quote_template_items for all
  to authenticated
  using (exists (select 1 from public.quote_templates t where t.id = template_id and t.created_by = auth.uid()))
  with check (exists (select 1 from public.quote_templates t where t.id = template_id and t.created_by = auth.uid()));
