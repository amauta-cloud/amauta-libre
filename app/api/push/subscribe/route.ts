import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const subscription = await req.json()
  const endpoint: string = subscription.endpoint
  const p256dh: string = subscription.keys?.p256dh
  const auth: string = subscription.keys?.auth

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  await supabase.from('push_subscriptions').upsert(
    { usuario_id: user.id, endpoint, p256dh, auth },
    { onConflict: 'usuario_id,endpoint' }
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await req.json()
  await supabase.from('push_subscriptions').delete().eq('usuario_id', user.id).eq('endpoint', endpoint)

  return NextResponse.json({ ok: true })
}
