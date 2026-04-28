import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'amauta.iiaa@gmail.com'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const usuario_id = req.nextUrl.searchParams.get('usuario_id')
  if (!usuario_id) return NextResponse.json({ error: 'usuario_id required' }, { status: 400 })

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data, error } = await admin
    .from('notas_admin_usuarios')
    .select('nota')
    .eq('usuario_id', usuario_id)
    .maybeSingle()

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ notSupported: true })
    return NextResponse.json({ nota: null })
  }

  return NextResponse.json({ nota: data?.nota ?? null })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { usuario_id, nota } = await req.json() as { usuario_id?: string; nota?: string }
  if (!usuario_id) return NextResponse.json({ error: 'usuario_id required' }, { status: 400 })

  const admin = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { error } = await admin.from('notas_admin_usuarios').upsert({
    usuario_id,
    nota: nota ?? '',
    actualizado_en: new Date().toISOString(),
  }, { onConflict: 'usuario_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
