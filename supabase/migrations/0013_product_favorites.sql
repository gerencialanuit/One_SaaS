-- Favoritos por comercial: productos recurrentes para cotizar mas rapido.
-- Estrictamente personal (cada usuario ve/gestiona solo sus propios favoritos),
-- no es un catalogo compartido de "productos destacados" del equipo.

create table public.product_favorites (
  profile_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, product_id)
);

alter table public.product_favorites enable row level security;

create policy "usuarios gestionan sus propios favoritos"
  on public.product_favorites
  for all
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
