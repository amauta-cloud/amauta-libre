import { NextRequest, NextResponse } from 'next/server'
import { createClient as createUserClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'amauta.iiaa@gmail.com'

/**
 * Autoriza los endpoints de push (crons + disparo manual del admin).
 *
 * Devuelve `null` si el request está autorizado, o un `NextResponse` 401 si no.
 *
 * Órdenes de auth aceptados (en este orden):
 *  1. `Authorization: Bearer <CRON_SECRET>`  → lo inyecta Vercel Cron.
 *  2. Token estático `PUSH_TOKEN` por header `x-push-token` (preferido) o
 *     query `?token=` (compat con los Anthropic Cloud Remote Agents).
 *  3. Sesión de admin (para el disparo manual desde el panel).
 *
 * IMPORTANTE: a diferencia de la versión anterior, esto FALLA CERRADO.
 * Si no hay `CRON_SECRET` ni `PUSH_TOKEN` seteados, ningún request anónimo
 * pasa — antes, sin `CRON_SECRET`, cualquiera podía disparar push masivo.
 */
export async function authorizePush(req: NextRequest): Promise<NextResponse | null> {
  const cronSecret = process.env.CRON_SECRET
  const pushToken = process.env.PUSH_TOKEN

  // 1. Cron header
  const authHeader = req.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return null

  // 2. Token estático (header preferido; query solo por compatibilidad)
  if (pushToken) {
    const headerToken = req.headers.get('x-push-token')
    const queryToken = req.nextUrl.searchParams.get('token')
    if (headerToken === pushToken || queryToken === pushToken) return null
  }

  // 3. Admin logueado (disparo manual)
  try {
    const userClient = await createUserClient()
    const { data: { user } } = await userClient.auth.getUser()
    if (user && user.email === ADMIN_EMAIL) return null
  } catch {
    // sin sesión → no autorizado
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
