import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieToSet = { name: string; value: string; options: CookieOptions }

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Rutas publicas (auth + el futuro link compartible de cotizaciones en Fase 7).
  // Todo lo demas requiere sesion — por defecto protegido, no por lista blanca de rutas privadas.
  // OJO: '/quote/' lleva slash final a proposito — sin el, 'startsWith' tambien
  // matchearia '/quotes' (el modulo privado) y lo dejaria sin proteger.
  const PUBLIC_PREFIXES = ['/login', '/signup', '/forgot-password', '/update-password', '/check-email', '/callback', '/quote/']
  const isPublicRoute = PUBLIC_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix))

  if (!isPublicRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const isAuthOnlyRoute = ['/login', '/signup'].some((prefix) => request.nextUrl.pathname.startsWith(prefix))
  if (isAuthOnlyRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}
