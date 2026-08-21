# Freshbooks Style - Sistema de Diseño

> Estilo oficial del proyecto "Cotizador One Automatizacion" (reemplaza Liquid Glass).
> Paleta base extraida directo del CSS computado de freshbooks.com. Los acentos de marca fueron
> recoloreados dos veces a pedido del usuario (2026-08-14 y 2026-08-20, ver "Historial de acentos" abajo).
> Estado FINAL desde 2026-08-20: **un solo acento de marca** (naranja, token `brand-blue`). El token
> `brand-green` ya NO EXISTE — se elimino de `tailwind.config.ts` tras consolidar todo a un solo acento.

## Que es

Un estilo **limpio, profesional y accesible** propio de software de facturacion/administracion B2B: fondo claro,
tarjetas blancas con sombra suave, un unico acento de color, tipografia legible, mucho whitespace.
Cero glassmorphism, cero fondos oscuros, cero blur — contraste alto y foco en legibilidad de datos (precios,
tablas, cotizaciones).

## Historial de acentos

**2026-08-14** — primer recoloreo: lo que era azul paso a naranja oscuro (`brand-blue`), lo que era verde
paso a gris oscuro (`brand-green`, usado solo en botones de accion). El verde `#038A06` se mantuvo
hardcodeado explicito (no via token) en 4 lugares que comunican exito semantico: badge "Aprobada"
(`quotes/constants.ts`), badge "Recibida" (`purchase-orders`), texto "Aprobada por gerencia"
(`VersionHistoryList`), mensaje de confirmacion del link publico (`SharedQuoteView`).

**2026-08-20** — investigacion de paletas de SaaS reconocidos (Linear, Stripe, HubSpot, Notion, Xero):
el patron sin excepcion es **un solo acento de marca**, nunca dos compitiendo. El usuario confirmo
consolidar todo al naranja: cada boton que antes usaba `bg-brand-green` (gris) ahora usa `bg-brand-blue`
(naranja) — reemplazo masivo en 20 archivos. El token `brand-green`/`brand-green-hover` se **elimino** de
`tailwind.config.ts` por quedar sin uso. Los 4 usos semanticos de exito (`#038A06` hardcodeado) NO se
tocaron — siguen siendo la excepcion intencional, separados del acento de marca.

**Al agregar una feature nueva**: usa `bg-brand-blue`/`hover:bg-brand-blue-hover` para CUALQUIER boton
(primario Y secundario — ya no hay distincion de color entre ellos, la jerarquia se marca con relleno
solido vs. outline/texto). Si necesitas indicar "exito"/"aprobado", usa el hex explicito `#038A06`
(o `bg-[#038A06]/10 text-[#038A06]`) — nunca un token de marca.

**2026-08-20 (ajuste de tono)** — el primer naranja elegido (`#C2410C` base, `#7C2D12` para el nav activo
del Sidebar) se veia como cafe/marron en pantalla real, no naranja. Causa: a esa oscuridad y con el matiz
tan cercano al rojo (H~17°), un naranja oscuro se percibe como oxido/cafe, no como "naranja". Fix: subir
un escalon toda la escala (mismos 3 valores, mas claros) para que el matiz se lea inequivocamente naranja
mientras se mantiene oscuro. Verificar SIEMPRE un cambio de color oscuro con una captura real o estilos
computados en el navegador, no solo con el codigo hex — el mismo hex puede leerse distinto de lo esperado
segun cuanto se oscurezca.

**2026-08-21 (naranja final, extraido de referencia real)** — el usuario referencio kavana-home.com
(mismo rubro: instalacion de casas inteligentes) y su naranja de marca. Extraido de sus estilos
computados reales: `#F15523` (259 apariciones, color dominante del sitio). Es mas claro/vibrante que
nuestros intentos anteriores con hue similar — confirma que la claridad, no el matiz, era el problema.
Adoptado como `brand.blue` (base).

**Ajuste inmediato del usuario**: al ver el resultado real en pantalla (sidebar + filtros de categoria),
pidio que `blue-hover` y `blue-dark` sean el MISMO `#F15523`, sin variantes mas oscuras — un solo naranja
plano en todos los estados (base, hover, activo). Los 3 tokens quedan con el mismo valor.

## Paleta de Color

```css
/* Texto */
--navy: #001B40;           /* texto principal, headings */
--slate: #576981;          /* texto secundario */
--muted: #99A4B3;          /* texto terciario / placeholders */

/* Marca — UN SOLO acento, UN SOLO valor (naranja de kavana-home.com, mismo rubro) */
--brand-blue: #F15523;      /* naranja: todo boton, link, nav activo, focus ring, filtros de categoria */
--brand-blue-hover: #F15523; /* mismo valor a proposito — sin variante mas oscura */
--brand-blue-dark: #F15523;  /* mismo valor a proposito — sidebar/estado activo */
--brand-yellow: #FFC414;   /* alertas suaves, destacados (ej: "cotizacion caliente") */
--success-green: #038A06;  /* SOLO para badges/mensajes de "aprobado"/exito, hardcodeado, no es token */

/* Fondos */
--bg-page: #F7F9FC;        /* fondo general de la app — claro, sin cambios desde el inicio */
--bg-card: #FFFFFF;        /* tarjetas */
--tint-blue: #FDF0E6;      /* fondo de bloques informativos — tinte naranja claro */
--tint-yellow: #FFF9E8;    /* fondo de alertas/warnings suaves */
--border: #E5E9EF;         /* bordes de tarjetas/inputs */
```

### Tailwind (ya aplicado en `tailwind.config.ts`)

```ts
colors: {
  navy: '#001B40',
  slate: {
    DEFAULT: '#576981',
    muted: '#99A4B3',
  },
  brand: {
    blue: '#F15523',
    'blue-hover': '#F15523',
    'blue-dark': '#F15523',
    yellow: '#FFC414',
  },
  tint: {
    blue: '#FDF0E6',
    yellow: '#FFF9E8',
  },
}
```

## Tipografia

Freshbooks usa "Founders Grotesk" (headings, de pago) + "IBM Plex Sans" (body, gratis). En este proyecto:

- **Headings**: `Plus Jakarta Sans` (geometrica, gratis, mismo espiritu que Founders Grotesk) — peso 600/700
- **Body**: `IBM Plex Sans` (identica a la de Freshbooks, gratis en Google Fonts) — peso 400/500

```tsx
// src/app/layout.tsx
import { Plus_Jakarta_Sans, IBM_Plex_Sans } from 'next/font/google'

const heading = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-heading', weight: ['600', '700'] })
const body = IBM_Plex_Sans({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600'] })
```

```ts
// tailwind.config.ts
fontFamily: {
  heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
  sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
}
```

## Ingredientes Core

- **Border radius**: moderado, NUNCA extremo. `rounded-lg` (8px) en cards/botones, `rounded-md` (6px) en inputs.
- **Sombras**: suaves y bajas, nunca dramaticas. `shadow-sm` por defecto, `shadow-md` en hover de cards clickeables.
- **Bordes**: `border border-[#E5E9EF]` en cards e inputs — el borde define el limite, no la sombra.
- **Espaciado**: generoso. `p-6` en cards, `gap-4`/`gap-6` entre elementos, nunca apretado.
- **Sin blur, sin transparencia** — fondos siempre solidos (`bg-white`, `bg-[#F7F9FC]`).

## Recetas Listas para Usar

### Card

```html
<div class="bg-white border border-[#E5E9EF] rounded-lg shadow-sm p-6">
  <h3 class="font-heading font-semibold text-navy">Titulo</h3>
  <p class="text-slate mt-1">Contenido de la card</p>
</div>
```

### Boton Primario (CTA — verde)

```html
<button class="bg-brand-green hover:bg-brand-green-hover text-white font-medium rounded-lg px-5 py-2.5 transition-colors">
  Enviar cotización
</button>
```

### Boton Secundario (azul, outline)

```html
<button class="border border-brand-blue text-brand-blue hover:bg-tint-blue font-medium rounded-lg px-5 py-2.5 transition-colors">
  Guardar borrador
</button>
```

### Boton Terciario (texto plano)

```html
<button class="text-slate hover:text-navy font-medium px-3 py-2 transition-colors">
  Cancelar
</button>
```

### Input

```html
<input
  type="text"
  placeholder="Nombre del cliente"
  class="w-full bg-white border border-[#E5E9EF] rounded-md px-4 py-2.5 text-navy placeholder-slate-muted outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
/>
```

### Badge de estado (cotizaciones)

```html
<!-- Aprobada -->
<span class="inline-flex items-center rounded-full bg-brand-green/10 px-2.5 py-0.5 text-xs font-medium text-brand-green">Aprobada</span>
<!-- Caliente / pendiente -->
<span class="inline-flex items-center rounded-full bg-brand-yellow/20 px-2.5 py-0.5 text-xs font-medium text-[#8A6D00]">Pendiente</span>
<!-- Rechazada/vencida -->
<span class="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">Vencida</span>
```

### Sidebar (dashboard interno)

```html
<aside class="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-[#E5E9EF]">
  <div class="p-6">
    <h2 class="font-heading font-bold text-lg text-navy">One Automatización</h2>
  </div>
  <nav class="px-4 space-y-1">
    <a class="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-brand-blue-dark text-white font-medium">Cotizaciones</a>
    <a class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate hover:bg-tint-blue hover:text-navy transition-colors">Inventario</a>
  </nav>
</aside>
```

### Tabla de datos

```html
<table class="w-full text-sm">
  <thead>
    <tr class="border-b border-[#E5E9EF] text-left text-slate">
      <th class="py-3 font-medium">Cliente</th>
      <th class="py-3 font-medium">Total</th>
      <th class="py-3 font-medium">Estado</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-b border-[#E5E9EF] hover:bg-tint-blue/50 transition-colors">
      <td class="py-3 text-navy font-medium">Casa Los Robles</td>
      <td class="py-3 text-navy">$12.450.000</td>
      <td class="py-3"><span class="inline-flex items-center rounded-full bg-brand-green/10 px-2.5 py-0.5 text-xs font-medium text-brand-green">Aprobada</span></td>
    </tr>
  </tbody>
</table>
```

## Fondos Recomendados

Fondo general de la app: `bg-[#F7F9FC]` (gris azulado muy claro). Las cards siempre `bg-white` para contrastar.
Nunca usar gradientes decorativos ni imagenes de fondo — el estilo Freshbooks es plano y funcional.

## Mejores Practicas

### DO
1. Contraste alto siempre — texto navy sobre blanco/gris claro
2. Verde SOLO para la accion principal de cada pantalla (1 CTA verde por vista)
3. Azul para acciones secundarias y links
4. Bordes sutiles en vez de sombras pesadas para separar elementos
5. Numeros/precios en `font-heading` o `font-semibold` para que resalten en tablas

### DON'T
1. No usar `backdrop-blur` ni fondos semi-transparentes (eso era Liquid Glass, ya no aplica)
2. No usar mas de un boton verde por pantalla (diluye la jerarquia)
3. No usar bordes redondeados extremos (`rounded-2xl`/`rounded-3xl`) — se ve infantil, no profesional
4. No usar fondos oscuros en pantallas de datos/formularios

---

*Design system especifico del proyecto Cotizador One Automatizacion. Reemplaza Liquid Glass a partir de 2026-08-08.*
