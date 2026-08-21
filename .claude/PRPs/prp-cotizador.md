# PRP-001: Cotizador One Automatizacion

> **Estado**: APROBADO
> **Fecha**: 2026-08-08
> **Proyecto**: SaaS One Automatizacion (cotizador de casas inteligentes)

---

## Objetivo

Construir un cotizador agil que le permita a los comerciales de One Automatizacion armar una cotizacion en menos de 10 minutos, con visibilidad en tiempo real del inventario disponible y las llegadas de ordenes de compra, versionado completo de cada cotizacion, envio por WhatsApp/email, un link compartible con firma digital del cliente, y un dashboard de operacion para el gerente general.

## Por Que

| Problema | Solucion |
|----------|----------|
| Cada cotizacion toma mas de 1 hora en Excel | Cotizador digital con catalogo, calculo automatico de precio y fecha de entrega |
| El inventario vive en una planilla de Drive poco confiable | Tabla de inventario en Supabase con stock disponible vs. comprometido en tiempo real |
| Se prometen fechas de entrega que no se cumplen | Calculo automatico de fecha de entrega combinando stock disponible + llegadas de OC antes de esa fecha |
| No hay trazabilidad de cambios en una cotizacion | Versionado: cada ajuste crea una nueva version sin perder el historial |
| El gerente no tiene visibilidad de la operacion comercial | Dashboard con cotizaciones por estado (activas, calientes sin aprobar, aprobadas, vencidas) |
| Descuentos fuera de politica sin control | `discount_rules` por rol + flujo de aprobacion del gerente cuando se excede el limite |

**Valor de negocio**: Reducir el tiempo de elaboracion de una cotizacion de mas de 1 hora a menos de 10 minutos (KPI principal del negocio, ver `BUSINESS_LOGIC.md` seccion 5).

## Que

### Criterios de Exito
- [ ] Un comercial crea una cotizacion completa (cliente + productos + cantidades) en menos de 10 minutos
- [ ] Al seleccionar un producto, el sistema muestra stock disponible, stock comprometido en otras cotizaciones activas, y proximas llegadas con fecha
- [ ] El sistema calcula automaticamente el precio total y una fecha de entrega real basada en inventario + llegadas de OC
- [ ] Cada edicion de una cotizacion (cantidad, producto, descuento) genera una nueva version sin destruir el historial de versiones anteriores
- [ ] Un descuento que excede el limite del rol del comercial queda en estado "pendiente de aprobacion" hasta que el gerente lo aprueba
- [ ] La cotizacion se puede compartir por un link publico donde el cliente la ve, la firma digitalmente, y queda registrada su aceptacion/rechazo
- [ ] El comercial recibe una notificacion cuando el cliente ve, aprueba o rechaza la cotizacion
- [ ] El gerente ve un dashboard con cotizaciones agrupadas por estado (activas, calientes sin aprobar, aprobadas, vencidas) y metricas de conversion
- [ ] `npm run typecheck` y `npm run build` pasan sin errores

### Comportamiento Esperado
Happy path (ver `BUSINESS_LOGIC.md` seccion 2 para el detalle completo):
1. El comercial crea un nuevo proyecto/cotizacion indicando cliente y tipo de proyecto.
2. Selecciona productos del catalogo; ve stock disponible, comprometido, y llegadas futuras en tiempo real.
3. El sistema calcula precio total y fecha de entrega real automaticamente.
4. Cada ajuste (cantidad/producto/descuento) crea una nueva version de la cotizacion.
5. Se genera la cotizacion como PDF + link compartible.
6. Se envia al cliente por WhatsApp y/o email.
7. El cliente revisa la cotizacion online y la aprueba con firma digital.
8. El comercial recibe notificacion cuando el cliente ve, aprueba o rechaza.
9. Toda la operacion es visible en el dashboard del gerente.

---

## Contexto

### Precondicion critica (bloqueante)
La tabla `profiles` con el enum `user_role` (`comercial`, `inventarios`, `compras`, `gerente`) **ya existe como archivo de migracion** en `supabase/migrations/0001_create_profiles_with_roles.sql`, pero al momento de escribir este PRP **no se pudo confirmar que este aplicada en el proyecto remoto de Supabase** (el MCP de Supabase no tuvo permisos para listar tablas/migraciones durante la investigacion de este PRP). Toda la Fase 1 de este PRP **asume que `profiles`/`user_role` ya existen en la base de datos remota**. La primera subtarea de Fase 1 (al entrar por bucle-agentico) DEBE verificar con `mcp__supabase__list_tables` que `profiles` existe antes de crear cualquier tabla nueva; si no existe, se debe aplicar `0001_create_profiles_with_roles.sql` primero con `mcp__supabase__apply_migration` y solo despues continuar con el resto de este PRP.

### Referencias (codigo existente a seguir como patron)
- `src/lib/supabase/client.ts` y `src/lib/supabase/server.ts` — clientes Supabase (browser/server) ya configurados, reusar tal cual.
- `src/actions/auth.ts` — patron de Server Actions (`'use server'`, `revalidatePath`, retorno `{ error }`/`{ success }`). Seguir el mismo patron para las Server Actions de cotizador.
- `src/types/database.ts` — patron de tipado manual de tablas Supabase (`Row`/`Insert`/`Update` por tabla dentro de `Database['public']['Tables']`). Extender este archivo (o dividirlo por feature) con las tablas nuevas.
- `src/features/auth/` — estructura feature-first de referencia (`components/`, `hooks/`, `services/`, `store/`, `types/`).
- `src/features/dashboard/` — carpeta ya creada pero vacia (solo `.gitkeep`), es donde va el dashboard de este PRP.
- `supabase/migrations/0001_create_profiles_with_roles.sql` — unica migracion existente; siguiente migracion debe numerarse `0002_...`.
- `.claude/design-systems/freshbooks-style/freshbooks-style.md` — design system oficial del proyecto (reemplazo el 2026-08-08 de Liquid Glass, ya aplicado en `auth`): fondo claro `#F7F9FC`, cards blancas `border-[#E5E9EF]` + `shadow-sm`, CTA verde `brand-green`, acciones secundarias azules `brand-blue`, tipografia `font-heading` (Plus Jakarta Sans) + `font-sans` (IBM Plex Sans). Leer completo antes de construir componentes visuales. Reusar las recetas de card/boton/input/tabla/badge/sidebar del documento — NO reintroducir `backdrop-blur` ni fondos oscuros.
- `BUSINESS_LOGIC.md` (raiz del proyecto) — fuente de verdad del negocio, roles, y arquitectura de datos sugerida.

### Dependencias externas nuevas (no instaladas todavia)
- Generacion de PDF (ej. `@react-pdf/renderer` o similar) — decidir en Fase 7.
- Envio de WhatsApp (API de WhatsApp Business / proveedor tipo Twilio o similar) — decidir en Fase 8. No hay skill `add-emails`/integracion aplicada todavia en este proyecto: **Fase 8 debe correr el skill `/add-emails` para Resend** antes de construir notificaciones por email, y evaluar el proveedor de WhatsApp con el usuario si no hay uno definido.
- Firma digital: puede resolverse con una captura simple (canvas → imagen/base64) sin libreria externa pesada para el MVP.

### Arquitectura Propuesta (Feature-First)
```
src/features/
├── products/                 # Catalogo de productos y proveedores
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   └── types/
├── inventory/                 # Stock disponible/comprometido, alertas de stock bajo
├── purchase-orders/           # Ordenes de compra y fechas de llegada
├── clients/                    # Gestion de clientes
├── quotes/                     # Cotizador: creacion, versionado, calculo de precio/fecha
├── quote-sharing/               # Link publico, PDF, firma digital
├── notifications/                # Envio y registro de notificaciones (WhatsApp + email)
└── dashboard/                     # Ya existe vacia; dashboard de operacion del gerente
```

### Modelo de Datos

```sql
-- Precondicion: public.user_role y public.profiles ya existen (migracion 0001)

-- === Catalogo ===
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  created_at timestamptz default now() not null
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique,
  name text not null,
  category text not null, -- camaras, sensores, automatizacion, etc.
  supplier_id uuid references public.suppliers(id),
  unit_price numeric(12,2) not null,
  unit_cost numeric(12,2),
  low_stock_threshold integer not null default 5,
  is_active boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.inventory (
  product_id uuid primary key references public.products(id) on delete cascade,
  quantity_on_hand integer not null default 0, -- stock fisico real
  updated_at timestamptz default now() not null,
  updated_by uuid references public.profiles(id)
);

-- Vista: Disponibilidad con Cotizaciones (campo separado del stock fisico)
-- available_with_quotes = quantity_on_hand - comprometido en cotizaciones activas
create view public.inventory_availability as
select
  i.product_id,
  i.quantity_on_hand,
  coalesce(committed.qty, 0) as committed_in_quotes,
  i.quantity_on_hand - coalesce(committed.qty, 0) as available_with_quotes
from public.inventory i
left join (
  select qi.product_id, sum(qi.quantity) as qty
  from public.quote_items qi
  join public.quote_versions qv on qv.id = qi.quote_version_id
  join public.quotes q on q.id = qv.quote_id and q.current_version_id = qv.id
  where q.status in ('draft', 'sent', 'pending_approval')
  group by qi.product_id
) committed on committed.product_id = i.product_id;

-- === Compras ===
create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) not null,
  status text not null default 'pending', -- pending | partial | received | cancelled
  expected_arrival_date date not null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null
);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid references public.purchase_orders(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12,2)
);

-- === Clientes ===
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text,
  email text,
  address text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now() not null
);

-- === Reglas de descuento ===
create table public.discount_rules (
  role public.user_role primary key,
  max_discount_percent numeric(5,2) not null default 0
);

-- === Cotizaciones (versionadas) ===
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) not null,
  commercial_id uuid references public.profiles(id) not null,
  project_type text not null, -- camaras, sensores, automatizacion, etc.
  status text not null default 'draft', -- draft | sent | pending_approval | approved | rejected | expired
  current_version_id uuid, -- FK diferida hacia quote_versions (se setea despues del insert)
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.quote_versions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade not null,
  version_number integer not null,
  subtotal numeric(12,2) not null,
  discount_percent numeric(5,2) not null default 0,
  total numeric(12,2) not null,
  estimated_delivery_date date,
  requires_approval boolean not null default false,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null,
  unique (quote_id, version_number)
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_version_id uuid references public.quote_versions(id) on delete cascade not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null
);

-- === Compartir + firma ===
create table public.quote_signatures (
  id uuid primary key default gen_random_uuid(),
  quote_version_id uuid references public.quote_versions(id) not null,
  share_token uuid not null default gen_random_uuid(), -- usado en el link publico
  viewed_at timestamptz,
  decision text, -- null | approved | rejected
  signature_data text, -- base64 de la firma capturada
  signer_name text,
  signer_ip text,
  decided_at timestamptz,
  created_at timestamptz default now() not null
);

-- === Notificaciones ===
create table public.notifications_log (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) not null,
  channel text not null, -- whatsapp | email
  recipient text not null,
  event text not null, -- quote_sent | quote_viewed | quote_approved | quote_rejected
  status text not null default 'pending', -- pending | sent | failed
  provider_message_id text,
  created_at timestamptz default now() not null
);

-- RLS: habilitar en TODAS las tablas anteriores.
-- Patron general:
--   - comercial: CRUD sobre sus propias quotes/quote_versions/quote_items/clients; SELECT sobre products/inventory/purchase_orders (solo lectura)
--   - inventarios: CRUD sobre products/inventory; SELECT sobre purchase_orders
--   - compras: CRUD sobre suppliers/purchase_orders/purchase_order_items
--   - gerente: SELECT total (todas las filas) + UPDATE sobre quote_versions.approved_by/approved_at (aprobar descuentos)
-- Definir las policies exactas durante Fase 1, reusando el patron de "Gerente can view all profiles" de la migracion 0001.
```

**Notas de calculo:**
- `Disponibilidad con Cotizaciones` (`inventory_availability.available_with_quotes`) es un campo propio, expuesto por la vista de arriba — NO se calcula ad-hoc en cada componente. Es la fuente unica de verdad para "cuanto puedo prometer sin esperar una OC". Se recalcula en tiempo real en cada SELECT (sin trigger que sincronizar, sin riesgo de quedar desactualizado).
- `fecha de entrega estimada` de una cotizacion = el maximo, entre todos sus `quote_items`, de: si `quantity <= available_with_quotes del producto` (vista `inventory_availability`) → fecha de hoy; si no, la fecha del primer `purchase_order` (ordenado por `expected_arrival_date`) cuya suma acumulada de `purchase_order_items.quantity` (para ese producto, con `status != 'cancelled'`) cubra el faltante.
- `requires_approval` en `quote_versions` = `true` si `discount_percent` > `discount_rules.max_discount_percent` para el rol del `commercial_id`.

---

## Blueprint (Assembly Line)

> IMPORTANTE: Solo definir FASES. Las subtareas se generan al entrar a cada fase
> siguiendo el bucle agentico (mapear contexto → generar subtareas → ejecutar)

### Fase 1: Fundacion de datos
**Objetivo**: Verificar precondicion de `profiles`/`user_role`, y crear el esquema completo (`suppliers`, `products`, `inventory`, `purchase_orders`, `purchase_order_items`, `clients`, `discount_rules`, `quotes`, `quote_versions`, `quote_items`, `quote_signatures`, `notifications_log`) con RLS habilitado en cada tabla, mas la extension de `src/types/database.ts` (o tipos por feature) con los tipos generados.
**Validacion**: `mcp__supabase__list_tables` muestra las 12 tablas nuevas + `profiles`; `mcp__supabase__get_advisors` sin alertas de seguridad criticas (RLS deshabilitado); `npm run typecheck` pasa.

### Fase 2: Catalogo y disponibilidad de inventario
**Objetivo**: Feature `products` + `inventory` — CRUD de productos/proveedores (rol inventarios), UI que muestra los 3 campos por separado: stock fisico (`quantity_on_hand`), comprometido (`committed_in_quotes`) y **Disponibilidad con Cotizaciones** (`available_with_quotes`, vista `inventory_availability`), alertas de stock bajo (`low_stock_threshold`).
**Validacion**: Un usuario con rol `inventarios` puede crear/editar productos e inventario; un `comercial` solo puede leerlos (verificar con RLS); la UI muestra "Disponibilidad con Cotizaciones" como campo distinto y visible, no mezclado con el stock fisico; Playwright screenshot de la UI de catalogo.

### Fase 3: Compras y llegadas
**Objetivo**: Feature `purchase-orders` — registrar ordenes de compra a proveedores con fecha estimada de llegada (rol compras), listar llegadas proximas por producto.
**Validacion**: Un usuario `compras` crea una OC con items y fecha; el stock disponible calculado en Fase 2 refleja correctamente las llegadas futuras (no las suma al stock actual, solo a la proyeccion de fecha de entrega).

### Fase 4: Clientes
**Objetivo**: Feature `clients` — CRUD de clientes con datos de contacto (WhatsApp, email), usado por el cotizador.
**Validacion**: Un comercial crea un cliente nuevo desde el flujo de cotizacion o desde una pantalla dedicada.

### Fase 5: Cotizador core (creacion + calculo automatico)
**Objetivo**: Feature `quotes` — crear una cotizacion (cliente + tipo de proyecto), seleccionar productos con disponibilidad en tiempo real (stock disponible/comprometido/llegadas), calculo automatico de precio total y fecha de entrega real, guardado como `quote_versions` version 1.
**Validacion**: Un comercial completa el flujo de creacion de cotizacion en la UI en menos de 10 minutos (medido manualmente); el total y la fecha de entrega calculados coinciden con la logica de negocio documentada arriba.

### Fase 6: Versionado y aprobacion de descuentos
**Objetivo**: Cada edicion de una cotizacion (cantidad/producto/descuento) crea una nueva `quote_version` sin borrar las anteriores; aplicar `discount_rules` por rol; si el descuento excede el limite, la cotizacion pasa a `pending_approval` y el gerente puede aprobarla/rechazarla.
**Validacion**: Editar una cotizacion existente incrementa `version_number` y conserva el historial visible; un descuento fuera de politica bloquea el envio hasta aprobacion del gerente.

### Fase 7: Cotizacion compartible (PDF + link + firma digital)
**Objetivo**: Feature `quote-sharing` — generar PDF de la cotizacion, link publico (`share_token`) accesible sin login para el cliente, captura de firma digital (canvas) y decision (aprobar/rechazar) que actualiza `quote_signatures` y el estado de la `quote`.
**Validacion**: El link publico renderiza la cotizacion sin requerir autenticacion; firmar/rechazar actualiza `quote_signatures.decided_at` y el `quotes.status`; el PDF descargable coincide con la version mostrada.

### Fase 8: Notificaciones (WhatsApp + email)
**Objetivo**: Feature `notifications` — enviar la cotizacion por WhatsApp y/o email al cliente, y notificar al comercial cuando el cliente ve/aprueba/rechaza; registrar cada envio en `notifications_log`. Ejecutar el skill `/add-emails` (Resend) como parte de esta fase si aun no esta integrado.
**Validacion**: Enviar una cotizacion de prueba genera una fila en `notifications_log` con `status = sent`; un evento de vista/aprobacion/rechazo del cliente dispara notificacion al comercial.

### Fase 9: Dashboard de operacion (gerente)
**Objetivo**: Feature `dashboard` (ya existe la carpeta vacia) — vista para el gerente con cotizaciones agrupadas por estado (activas, calientes sin aprobar, aprobadas, vencidas), metricas de conversion (ganadas vs. perdidas, tiempo promedio de cierre), y cola de aprobaciones de descuento pendientes.
**Validacion**: Un usuario `gerente` ve el dashboard completo; un `comercial` no tiene acceso (verificar RLS/guard de ruta); Playwright screenshot del dashboard con datos de prueba.

### Fase 10: Validacion Final
**Objetivo**: Sistema funcionando end-to-end, desde creacion de cotizacion hasta firma del cliente y visibilidad en dashboard.
**Validacion**:
- [ ] `npm run typecheck` pasa
- [ ] `npm run build` exitoso
- [ ] `mcp__supabase__get_advisors` sin alertas criticas de seguridad (RLS)
- [ ] Playwright recorre el happy path completo (crear cotizacion → enviar → firmar como cliente → ver reflejado en dashboard) y confirma con screenshots
- [ ] Los 9 criterios de exito de la seccion "Que" estan cumplidos

---

## Decision de Producto

### 2026-08-13: El rol 'gerente' tiene acceso de administrador a TODOS los modulos
El usuario decidio explicitamente que `gerente` no es solo "ver todo + aprobar descuentos" (spec original de `BUSINESS_LOGIC.md`) sino que tambien puede CREAR/EDITAR en cualquier modulo (productos, inventario, proveedores, ordenes de compra, clientes, cotizaciones), igual que el rol especifico de cada uno. Motivo: equipo chico, el dueno/gerente opera todo al inicio.

Implementado via:
- Helper `hasRole(profile, ...roles)` en `src/lib/supabase/profile.ts` — retorna `true` si el perfil tiene alguno de los roles pedidos O es `gerente`. Usar SIEMPRE este helper (no comparar `profile.role === 'x'` directo) en Server Actions y paginas para chequear permisos de escritura, asi el override de gerente queda centralizado en un solo lugar.
- RLS: cada policy `"X administra Y"` ahora incluye `current_user_role() in ('X', 'gerente')` (migracion `0009_gerente_full_access.sql`), mas policies nuevas `for all` en `quotes`/`quote_versions`/`quote_items` para gerente (que antes solo tenia policies de SELECT/UPDATE de aprobacion).
- `receive_purchase_order()` acepta `compras` o `gerente`.

**Aplicar en**: Cualquier feature nueva (Fase 8/9/10 en adelante) que agregue un chequeo de rol — usar `hasRole()` desde el inicio, no repetir `profile.role === 'x'`.

## Aprendizajes (Self-Annealing / Neural Network)

> Esta seccion CRECE con cada error encontrado durante la implementacion.
> El conocimiento persiste para futuros PRPs. El mismo error NUNCA ocurre dos veces.

### 2026-08-12: CRITICO — policy de profiles con subconsulta recursiva sobre si misma + error swallowed = permisos de gerente rotos en silencio
- **Error**: La policy "Gerente can view all profiles" (migracion 0001, ANTES de introducir `current_user_role()`) hacia `exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'gerente')` — una subconsulta sobre la MISMA tabla `profiles` dentro de su propia policy. Postgres detecta esto como `infinite recursion detected in policy for relation "profiles"`. Ademas, `getCurrentProfile()` (`src/lib/supabase/profile.ts`) solo desestructuraba `data` de la respuesta de Supabase, nunca revisaba `error` — el error de recursion se tragaba en silencio y la funcion devolvia `null` como si el usuario no tuviera perfil. Resultado: CUALQUIER chequeo de rol basado en `profile?.role === 'x'` fallaba silenciosamente a `false` cuando disparaba esta policy. No se detecto en Fases 1-7 porque todos los checks de rol probados hasta entonces eran casos NEGATIVOS (ocultar un boton a quien NO tiene el rol) — un `profile` null y un `profile.role` incorrecto se ven identicos ahi. Recien se detecto al probar el PRIMER caso positivo real (el panel de aprobacion de descuento para gerente, que requiere `profile.role === 'gerente'` sea `true`).
- **Fix**: (1) Reescribir la policy usando `current_user_role()` en vez de la subconsulta directa (`current_user_role()` es SECURITY DEFINER y su consulta interna a `profiles` NO dispara RLS porque corre con los privilegios del dueño de la funcion, no del rol que llama). (2) `getCurrentProfile()` ahora revisa `error` y lo loggea antes de devolver `null`, para que errores asi nunca vuelvan a pasar desapercibidos.
- **Aplicar en**: CUALQUIER policy RLS que necesite consultar la MISMA tabla que protege (patron clasico: "el gerente ve todo") — SIEMPRE usar una funcion `SECURITY DEFINER` (`current_user_role()` o similar), NUNCA una subconsulta directa sobre la tabla propia. Y CUALQUIER funcion `getCurrent*`/`fetch*` que use Supabase — SIEMPRE revisar `error`, nunca desestructurar solo `data`. Verificar cualquier chequeo de rol con un caso POSITIVO real (no solo negativo) antes de darlo por validado.

### 2026-08-12: CRITICO — revocar EXECUTE de current_user_role() para 'authenticated' rompio TODAS las policies RLS que la usan
- **Error**: En la Fase 1, para cerrar un warning del security advisor ("SECURITY DEFINER function callable via REST"), se corrio `revoke execute on function public.current_user_role() from anon, authenticated, public;`. Esto rompio silenciosamente CUALQUIER query de un usuario logueado que disparara una policy RLS que llama a `current_user_role()` (practicamente todas las tablas: products, quotes, quote_versions, clients, suppliers, purchase_orders...) con el error `permission denied for function current_user_role`. No se detecto en Fase 1-6 porque las verificaciones con `curl` sin cookies solo probaban el redirect de `proxy.ts` (que no toca Postgres), nunca una query real autenticada contra RLS. Se detecto recien en Fase 7 al probar el endpoint REST crudo de `quote_signatures` con la anon key.
- **Fix**: `grant execute on function public.current_user_role() to authenticated;`. Una funcion SECURITY DEFINER usada DENTRO de policies RLS necesita EXECUTE para el rol que la dispara (`authenticated`), aunque eso tambien la deje invocable como RPC publico por usuarios logueados — en este caso es inofensivo porque solo devuelve el rol del propio llamador (`where id = auth.uid()`), nunca datos de otro usuario. Solo `anon` se mantiene sin acceso.
- **Aplicar en**: Cualquier funcion helper `SECURITY DEFINER` usada dentro de una policy RLS (patron `current_user_role()`), en este proyecto y en cualquier otro de la fabrica. Regla general: si el security advisor marca una funcion asi, primero verificar en QUE policies se usa antes de revocar EXECUTE a ciegas — revocar de `anon` casi siempre es seguro, revocar de `authenticated` casi nunca lo es si la funcion se usa dentro de RLS. Verificar el fix simulando una query autenticada real (`set local role authenticated; select set_config('request.jwt.claims', ...); select ...`), no solo con `curl` sin cookies (eso solo prueba el proxy, no las policies).

### 2026-08-08: PUBLIC_PREFIXES con '/quote' desprotegio '/quotes' por matching de prefijo
- **Error**: Al agregar Fase 5 (`/quotes`, `/quotes/new`), `curl` sin cookies devolvio `200` en vez de redirigir a `/login`. Causa: `PUBLIC_PREFIXES` en `proxy.ts` tenia `/quote` (pensando en el link publico de Fase 7, ej. `/quote/[token]`), y `'/quotes'.startsWith('/quote')` es `true` — el prefijo sin slash final matcheaba tambien el modulo PRIVADO de cotizaciones.
- **Fix**: Cambiar a `/quote/` (con slash final) en `PUBLIC_PREFIXES`. Verificado con curl que `/quotes` y `/quotes/new` vuelven a redirigir a `/login` sin sesion.
- **Aplicar en**: Cualquier prefijo publico agregado a `PUBLIC_PREFIXES` en este proyecto — SIEMPRE con slash final si existe (o podria existir) una ruta privada cuyo nombre empiece igual (ej. `/quote` vs `/quotes`, `/user` vs `/users`). Volver a correr los `curl` de verificacion de TODAS las rutas protegidas despues de tocar `PUBLIC_PREFIXES`, no solo la ruta nueva.

### 2026-08-08: proxy.ts en la raiz del repo era ignorado por completo (proyecto usa src/)
- **Error**: CRITICO. `proxy.ts` vivia en la raiz del proyecto (`D:\...\proyecto\proxy.ts`) pero el codigo de la app esta bajo `src/app`. Next.js 16 con estructura `src/` requiere que `proxy.ts` (igual que antes `middleware.ts`) viva DENTRO de `src/`, o lo ignora silenciosamente — sin error, sin warning en build ni en dev. Resultado: NINGUNA ruta estaba protegida, `/dashboard` y `/products` devolvian 200 a peticiones sin sesion (verificado con `curl` sin cookies). Solo se detecto probando con curl sin cookies, no con clicks de UI (el navegador aplicaba su propia sesion y ocultaba el problema).
- **Fix**: `mv proxy.ts src/proxy.ts`. Verificado con `curl -w "%{http_code} %{redirect_url}"` que ahora `/dashboard` y `/products` devuelven 307 a `/login` sin sesion.
- **Aplicar en**: Documentado tambien en el skill `add-login` (genera `proxy.ts` en la raiz sin detectar si el proyecto usa `src/`) y en `CLAUDE.md` — es un bug del TEMPLATE, afecta a cualquier proyecto SaaS Factory que use `src/` (que es el default). Al validar auth en cualquier proyecto nuevo: SIEMPRE probar con `curl` sin cookies a una ruta protegida, nunca confiar solo en clicks de navegador con sesion ya activa.

### 2026-08-08: proxy.ts solo protegia /dashboard, no el resto de rutas privadas
- **Error**: El `proxy.ts` generado por `/add-login` solo redirige a `/login` cuando `pathname.startsWith('/dashboard')`. Al agregar `/products` en Fase 2, la ruta quedaba accesible sin sesion (protegida solo por RLS de Supabase, no por el proxy — doble riesgo si algun query se hace mal).
- **Fix**: Invertir la logica a lista blanca de rutas PUBLICAS (`/login`, `/signup`, `/forgot-password`, `/update-password`, `/check-email`, `/callback`, `/quote` para el link compartible de Fase 7) — todo lo demas requiere sesion por defecto.
- **Aplicar en**: Cualquier feature nueva bajo `(main)/` en este proyecto ya queda protegida automaticamente sin tocar `proxy.ts` de nuevo. Si se agrega una ruta que SI debe ser publica, agregarla a `PUBLIC_PREFIXES`.

### 2026-08-08: Funciones SECURITY DEFINER quedan expuestas via API por defecto
- **Error**: `current_user_role()` y `handle_new_user()` (SECURITY DEFINER) fueron invocables directamente via `/rest/v1/rpc/<nombre>` por `anon`/`authenticated` sin que nadie las llamara explicitamente. `revoke execute ... from public` NO fue suficiente para `handle_new_user()` porque Supabase otorga permisos a `anon`/`authenticated` de forma explicita y separada de `PUBLIC`.
- **Fix**: `revoke execute on function ... from anon, authenticated, public;` (los 3 roles, no solo `public`). Verificado con `get_advisors(type: 'security')` hasta que devuelve `lints: []`.
- **Aplicar en**: Toda funcion `SECURITY DEFINER` nueva en este proyecto (y en cualquier proyecto Supabase) — revocar EXECUTE de los 3 roles inmediatamente despues de crearla, salvo que deba ser invocable publicamente a proposito (ej. el RPC de la Fase 7 para el link compartible, que SI necesita EXECUTE para `anon` mas validacion interna por token).

### 2026-08-08: Orden de creacion de la vista inventory_availability
- **Error**: Al escribir `0002_cotizador_core.sql` la vista `inventory_availability` se coloco justo despues de `inventory`, pero su definicion hace JOIN contra `quote_items`/`quote_versions`/`quotes`, que todavia no existian en ese punto del archivo — Postgres habria fallado con "relation does not exist" al ejecutarla.
- **Fix**: Mover la `create view` al final, despues de crear `quote_items` (la ultima tabla de la que depende).
- **Aplicar en**: Cualquier vista/funcion que dependa de tablas creadas mas adelante en la misma migracion — verificar el orden de dependencias ANTES de escribir el archivo completo, no solo al final.

---

## Gotchas

> Cosas criticas a tener en cuenta ANTES de implementar

- [x] Confirmado: `profiles`/`user_role` (migracion 0001), las 12 tablas de `0002_cotizador_core.sql` y el fix de seguridad `0003_restrict_security_definer_functions.sql` estan aplicados en el proyecto remoto (`gwsbczppcdiotzehlptb`). `get_advisors(security)` devuelve `lints: []`.
- [ ] `quotes.current_version_id` tiene una referencia circular con `quote_versions.quote_id` (una quote apunta a su version actual, una version apunta a su quote). Crear `quotes` sin el FK NOT NULL inicial, insertar la primera `quote_version`, y luego hacer `UPDATE quotes SET current_version_id = ...` (o usar un `ALTER TABLE` diferido). Documentar el orden exacto al implementar Fase 1/5.
- [ ] El link publico de `quote-sharing` (Fase 7) es accedido SIN autenticacion (el cliente no tiene cuenta) — sus RLS policies deben permitir SELECT publico solo por `share_token` exacto, nunca listar todas las filas.
- [ ] `stock disponible` NUNCA debe calcularse solo desde `inventory.quantity_on_hand` — siempre usar la vista `inventory_availability.available_with_quotes` (que ya resta el comprometido de cotizaciones activas draft/sent/pending_approval), o se prometeran fechas de entrega incorrectas (el problema de negocio original).
- [ ] "Disponibilidad con Cotizaciones" debe mostrarse SIEMPRE como campo separado en la UI (no fusionado visualmente con el stock fisico) — el usuario lo pidio explicitamente para poder distinguir cuanto hay fisicamente vs. cuanto realmente se puede prometer.
- [ ] Definir el proveedor de envio de WhatsApp con el usuario antes de Fase 8 — no hay integracion existente en el proyecto todavia.
- [ ] Design system del proyecto es Freshbooks-style (NO Liquid Glass): fondos claros y solidos, sin `backdrop-blur`, sin transparencias. Un solo boton verde (`brand-green`) por pantalla como CTA principal. Ver `.claude/design-systems/freshbooks-style/freshbooks-style.md`.

## Anti-Patrones

- NO crear nuevos patrones si los existentes funcionan (reusar `src/lib/supabase/*`, patron de Server Actions de `src/actions/auth.ts`)
- NO ignorar errores de TypeScript
- NO hardcodear valores (limites de descuento, umbrales de stock bajo → vienen de tablas, no de constantes en codigo)
- NO omitir validacion Zod en inputs de usuario (formularios de cotizacion, productos, OC, firma)
- NO calcular disponibilidad de stock sin considerar el comprometido de otras cotizaciones activas
- NO exponer datos de otras cotizaciones/clientes a traves del link publico compartible

---

*PRP aprobado por el usuario el 2026-08-08. Listo para ejecutar con bucle-agentico.*
