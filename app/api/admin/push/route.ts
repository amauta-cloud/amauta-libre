import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'amauta.iiaa@gmail.com'

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_SUBJECT ?? ADMIN_EMAIL}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: subscriptions } = await admin.from('push_subscriptions').select('*')
  if (!subscriptions?.length) return NextResponse.json({ sent: 0, total: 0 })

  const payload = JSON.stringify({
    title: '¡Hola! ¿Cómo van tus hábitos hoy? 🔥',
    body: 'Entrá y registrá tu progreso del día.',
    url: '/tablero',
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
    await admin.from('push_subscriptions').delete().in('id', expired)
  }

  return NextResponse.json({ sent, total: subscriptions.length, expired: expired.length })
}
