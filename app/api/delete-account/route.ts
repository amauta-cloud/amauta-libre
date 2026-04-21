import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id

  // Delete user data in order (leaf tables first to avoid FK conflicts)
  const tables: Array<{ table: string; column: string }> = [
    { table: 'habito_registros', column: 'usuario_id' },
    { table: 'habitos',          column: 'usuario_id' },
    { table: 'finanzas_diarias', column: 'usuario_id' },
    { table: 'metas',            column: 'usuario_id' },
    { table: 'tareas',           column: 'usuario_id' },
    { table: 'ideas',            column: 'usuario_id' },
    { table: 'eventos',          column: 'usuario_id' },
    { table: 'educacion_estado', column: 'usuario_id' },
    { table: 'usuarios',         column: 'id' },
  ]

  for (const { table, column } of tables) {
    await supabase.from(table).delete().eq(column, userId)
  }

  // Delete from auth.users — requires SUPABASE_SERVICE_ROLE_KEY in env vars
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    // Service role key not configured — data deleted but auth record remains
    return NextResponse.json({ success: true, note: 'data_deleted_auth_pending' })
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) {
    return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
