import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'amauta.iiaa@gmail.com'

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 })
  }
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_SUBJECT ?? ADMIN_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, body, segmento } = await req.json() as { title?: string; body?: string; segmento?: string }
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'title y body son requeridos' }, { status: 400 })
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Determinar usuario_ids para el segmento
  let targetUserIds: Set<string> | null = null

  if (segmento && segmento !== 'todos') {
    const hace7 = dateStr(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    const hace30 = dateStr(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

    if (segmento === 'nuevos_7d') {
      const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const hace7Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      targetUserIds = new Set((authData?.users ?? []).filter(u => new Date(u.created_at) > hace7Date).map(u => u.id))
    } else if (segmento === 'activos_30d') {
      const { data } = await admin.from('habito_registros').select('usuario_id').gte('fecha', hace30)
      targetUserIds = new Set((data ?? []).map(r => r.usuario_id))
    } else if (segmento === 'dormidos') {
      const { data: activos } = await admin.from('habito_registros').select('usuario_id').gte('fecha', hace30)
      const activosSet = new Set((activos ?? []).map(r => r.usuario_id))
      const { data: todos } = await admin.from('habito_registros').select('usuario_id').lt('fecha', hace30)
      const conHistorial = new Set((todos ?? []).map(r => r.usuario_id))
      targetUserIds = new Set([...conHistorial].filter(id => !activosSet.has(id)))
    }
  }

  const { data: rawSubscriptions } = await admin.from('push_subscriptions').select('*').order('created_at', { ascending: false })
  if (!rawSubscriptions?.length) return NextResponse.json({ sent: 0, total: 0 })

  const seen = new Map<string, typeof rawSubscriptions[0]>()
  for (const sub of rawSubscriptions) {
    if (!seen.has(sub.endpoint)) seen.set(sub.endpoint, sub)
  }
  let subscriptions = Array.from(seen.values())

  if (targetUserIds !== null) {
    subscriptions = subscriptions.filter(s => targetUserIds!.has(s.usuario_id))
  }

  const payload = JSON.stringify({ title: title.trim(), body: body.trim(), url: '/tablero' })

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
