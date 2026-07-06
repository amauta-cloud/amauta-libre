import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { authorizePush } from '@/lib/push-auth'

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

  const payload = JSON.stringify({
    title: 'Último día del mes 📅',
    body: 'Cerrá el mes — mirá tu análisis de finanzas y revisá tus metas.',
    url: '/tablero',
    campaign: 'cierre-mes',
  })

  let sent = 0
  const expired: string[] = []

  for (const sub of subscriptions) {
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
