-- TRM (USD -> COP) settings + moneda de cotizacion.
--
-- app_settings: tabla generica clave/valor para configuracion compartida del
-- sistema. Por ahora solo guarda 'trm_usd_cop', la tasa por defecto que se
-- usa para convertir productos con precio en USD a pesos colombianos al
-- construir una cotizacion. Se actualiza automaticamente cada vez que un
-- comercial guarda una cotizacion en COP con una tasa distinta, asi el
-- "default" siempre queda sincronizado con la ultima tasa usada.
create table if not exists public.app_settings (
  key text primary key,
  value numeric not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

alter table public.app_settings enable row level security;

create policy "app_settings select authenticated" on public.app_settings
  for select to authenticated using (true);

create policy "app_settings upsert authenticated" on public.app_settings
  for insert to authenticated with check (true);

create policy "app_settings update authenticated" on public.app_settings
  for update to authenticated using (true) with check (true);

insert into public.app_settings (key, value)
values ('trm_usd_cop', 3900)
on conflict (key) do nothing;

-- Moneda y tasa usada en cada version de cotizacion (snapshot inmutable,
-- igual que el resto de campos de quote_versions: una vez creada la version
-- no cambia, aunque la tasa por defecto de app_settings siga avanzando).
alter table public.quote_versions
  add column if not exists currency text not null default 'USD' check (currency in ('USD', 'COP')),
  add column if not exists trm_rate numeric;
