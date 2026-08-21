# BUSINESS_LOGIC.md - Cotizador One Automatizacion

> Generado por SaaS Factory | Fecha: 2026-08-08

## 1. Problema de Negocio

**Dolor:** Los comerciales de One Automatizacion (empresa colombiana de casas inteligentes) pierden tiempo elaborando cotizaciones de nuevos negocios o ajustando cotizaciones existentes para cada proyecto. Las cotizaciones se hacen hoy en Excel, de forma diaria. Adicionalmente, pierden tiempo revisando la disponibilidad real de inventario y la llegada de nuevos productos (hoy en una planilla de Google Drive/Excel poco confiable) para poder comprometer una fecha de entrega con el cliente.

**Costo actual:** Cada cotizacion toma mas de 1 hora en armarse. El inventario esta desactualizado y tiene baja confiabilidad, por lo que no se conoce la disponibilidad real de producto — esto provoca incumplimiento de negocios por fechas de entrega mal calculadas.

## 2. Solucion

**Propuesta de valor:** Un cotizador agil con visibilidad de inventario disponible y llegadas de ordenes de compra, para que los comerciales de One Automatizacion generen cotizaciones rapidas y comprometan fechas de entrega reales.

**Flujo principal (Happy Path):**
1. El comercial crea un nuevo proyecto/cotizacion indicando cliente y tipo de proyecto (camaras, sensores, automatizacion, etc.)
2. Selecciona productos del catalogo — el sistema muestra en tiempo real stock disponible, stock comprometido en otras cotizaciones, y proximas llegadas con fecha
3. El sistema calcula automaticamente el precio total y la fecha de entrega real (combinando inventario disponible + llegadas antes de esa fecha)
4. El comercial ajusta cantidades/productos/descuentos — cada ajuste genera una nueva version de la cotizacion sin perder el historial de versiones anteriores
5. Se genera la cotizacion como PDF + link compartible
6. Se envia al cliente por WhatsApp y/o email
7. El cliente revisa la cotizacion online y la aprueba con firma digital
8. El comercial recibe notificacion automatica cuando el cliente ve, aprueba o rechaza la cotizacion
9. Toda la operacion queda visible en un dashboard (por estado: activas, calientes sin aprobar, aprobadas, vencidas)

## 3. Usuario Objetivo

**Roles:**
- **Comercial de campo** — cotiza desde celular (en terreno) o desde la oficina
- **Responsable de inventarios** — mantiene el stock actualizado, reemplaza la planilla de Drive
- **Responsable de compras** — registra ordenes de compra a proveedores y fechas de llegada
- **Gerente general** — aprueba descuentos que excedan el limite del comercial y tiene visibilidad total de la operacion via dashboard

**Contexto:** Empresa colombiana del sector de casas inteligentes (domotica/seguridad). El proceso de venta depende de poder prometer con confianza una fecha de entrega, lo cual hoy falla por falta de visibilidad de inventario en tiempo real.

## 4. Arquitectura de Datos

**Input:**
- Catalogo de productos (precio, categoria, proveedor)
- Clientes (datos de contacto, WhatsApp, email)
- Proveedores
- Ordenes de compra (con fecha estimada de llegada)
- Inventario (stock fisico actual)
- Reglas de descuento/aprobacion (limite que el comercial puede aplicar sin aprobacion del gerente)
- Firma/aceptacion digital del cliente

**Output:**
- Cotizaciones en PDF + link compartible
- Notificaciones (WhatsApp/email) al comercial y al cliente
- Dashboard de operacion (cotizaciones por estado, para el gerente)
- Informe de disponibilidad de producto (stock actual + llegadas proximas)
- Alertas de stock bajo (para el responsable de compras)
- Historial/trazabilidad de versiones de cada cotizacion
- Reporte de conversion (cotizaciones ganadas vs. perdidas, tiempo promedio de cierre)

**Storage (Supabase tables sugeridas):**
- `profiles`: usuarios del sistema con rol (comercial, inventarios, compras, gerente)
- `clients`: clientes con datos de contacto (whatsapp, email)
- `suppliers`: proveedores
- `products`: catalogo de productos (precio, categoria, proveedor_id)
- `inventory`: stock fisico actual por producto
- `purchase_orders`: ordenes de compra a proveedores (fecha estimada de llegada)
- `purchase_order_items`: items de cada orden de compra
- `quotes`: cotizacion (cliente, comercial, estado, version actual)
- `quote_versions`: historial de versiones de una cotizacion
- `quote_items`: productos, cantidades y precios dentro de una version de cotizacion
- `discount_rules`: limites de descuento por rol/usuario
- `quote_signatures`: firma digital y aceptacion del cliente
- `notifications_log`: registro de notificaciones enviadas (whatsapp/email)

## 5. KPI de Exito

**Metrica principal:** Reducir el tiempo de elaboracion de una cotizacion de mas de 1 hora a menos de 10 minutos.

## 6. Especificacion Tecnica (Para el Agente)

### Features a Implementar (Feature-First)
```
src/features/
├── auth/                # Autenticacion Email/Password (Supabase) + roles
├── products/            # Catalogo de productos y proveedores
├── inventory/           # Inventario disponible, stock comprometido, alertas de stock bajo
├── purchase-orders/     # Ordenes de compra y fechas de llegada
├── clients/              # Gestion de clientes
├── quotes/                # Cotizador: creacion, versionado, calculo de precio y fecha de entrega
├── quote-sharing/          # Link compartible, PDF, firma digital de aceptacion
├── notifications/           # Envio y registro de notificaciones (WhatsApp + email)
└── dashboard/                # Dashboard de operacion (estados, conversion, cotizaciones calientes)
```

### Stack Confirmado
- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind 3.4 + shadcn/ui
- **Backend:** Supabase (Auth + Database + Storage)
- **Validacion:** Zod
- **State:** Zustand (si necesario)
- **MCPs:** Next.js DevTools + Playwright + Supabase

### Proximos Pasos
1. [ ] Setup proyecto base
2. [ ] Configurar Supabase
3. [ ] Implementar Auth (roles: comercial, inventarios, compras, gerente)
4. [ ] Feature: products + inventory + purchase-orders
5. [ ] Feature: clients
6. [ ] Feature: quotes (cotizador + versionado + calculo de fecha de entrega)
7. [ ] Feature: quote-sharing (link, PDF, firma digital)
8. [ ] Feature: notifications (WhatsApp + email)
9. [ ] Feature: dashboard
10. [ ] Testing E2E
11. [ ] Deploy Vercel
