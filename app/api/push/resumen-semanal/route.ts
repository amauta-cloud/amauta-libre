import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { authorizePush } from '@/lib/push-auth'
import { cumplido } from '@/lib/cumplido'

export async function GET(req: NextRequest) {
  const unauthorized = await authorizePush(req)
  if (unauthorized) return unauthorized

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
  }
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_SUBJECT ?? 'amauta.iiaa@gmail.com'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: rawSubscriptions } = await supabase.from('push_subscriptions').select('*').order('created_at', { ascending: false })
  if (!rawSubscriptions?.length) return NextResponse.json({ sent: 0 })

  const seen = new Map<string, typeof rawSubscriptions[0]>()
  for (const sub of rawSubscriptions) {
    if (!seen.has(sub.endpoint)) seen.set(sub.endpoint, sub)
  }
  const subscriptions = Array.from(seen.values())

  // Build per-user dias activos esta semana
  const hace7Str = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

  const { data: registros } = await supabase
    .from('habito_registros')
    .select('usuario_id, habito_id, fecha, valor_bool, valor_numero')
    .gte('fecha', hace7Str)
  // Las metas de los hábitos con número: la misma regla de «cumplido» que la app (19/10/2026)
  const { data: conMeta } = await supabase.from('habitos').select('id, meta_numero').not('meta_numero', 'is', null).limit(5000)
  const metaPorHabito = new Map((conMeta ?? []).map(h => [h.id, h.meta_numero]))

  const diasPorUsuario = new Map<string, Set<string>>()
  for (const r of registros ?? []) {
    const activo = cumplido(r, metaPorHabito.get(r.habito_id))
    if (!activo) continue
    if (!diasPorUsuario.has(r.usuario_id)) diasPorUsuario.set(r.usuario_id, new Set())
    diasPorUsuario.get(r.usuario_id)!.add(r.fecha)
  }

  let sent = 0
  const expired: string[] = []

  for (const sub of subscriptions) {
    const dias = diasPorUsuario.get(sub.usuario_id)?.size ?? 0
    let body: string
    if (dias >= 7) {
      body = '¡Semana perfecta! 7 de 7 días. Sos de los pocos que realmente lo hacen.'
    } else if (dias >= 4) {
      body = `${dias} días esta semana. Bien. La próxima semana apuntá a 7.`
    } else if (dias >= 1) {
      body = `${dias} día${dias > 1 ? 's' : ''} esta semana. Arrancaste. Ahora no pares.`
    } else {
      body = 'Esta semana empieza hoy. Entrá y marcá un hábito.'
    }

    const payload = JSON.stringify({
      title: 'Tu semana en Amauta 📊',
      body,
      url: '/tablero',
      campaign: 'resumen-semanal',
    })

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      )
      sent++
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
        expired.push(sub.id)
      }
    }
  }

  if (expired.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expired)
  }

  return NextResponse.json({ sent, expired: expired.length })
}
