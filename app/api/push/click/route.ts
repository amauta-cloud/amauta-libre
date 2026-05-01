import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createUserClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const userClient = await createUserClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return NextResponse.json({ ok: true })

  const { campaign } = await req.json().catch(() => ({ campaign: 'unknown' }))

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  await supabase.from('push_events').insert({
    usuario_id: user.id,
    campaign: campaign ?? 'unknown',
  })

  return NextResponse.json({ ok: true })
}
