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

  // Delete from auth.users requires the service role key. Sin él no podemos
  // completar el borrado (GDPR): fallamos fuerte en vez de mentir "success".
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: 'Account deletion not available (server misconfigured)' },
      { status: 500 },
    )
  }

  // Delete user data in order (leaf tables first to avoid FK conflicts).
  // Con el service role ignoramos RLS y limpiamos todo lo del usuario.
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const tables: Array<{ table: string; column: string }> = [
    { table: 'habito_registros',    column: 'usuario_id' },
    { table: 'habitos',             column: 'usuario_id' },
    { table: 'finanzas_items',      column: 'usuario_id' },
    { table: 'finanzas_diarias',    column: 'usuario_id' },
    { table: 'finanzas_categorias', column: 'usuario_id' },
    { table: 'metas',               column: 'usuario_id' },
    { table: 'tareas',              column: 'usuario_id' },
    { table: 'ideas',               column: 'usuario_id' },
    { table: 'eventos',             column: 'usuario_id' },
    { table: 'educacion_estado',    column: 'usuario_id' },
    { table: 'push_subscriptions',  column: 'usuario_id' },
    { table: 'push_events',         column: 'usuario_id' },
    { table: 'soporte_mensajes',    column: 'usuario_id' },
    { table: 'usuarios',            column: 'id' },
  ]

  const failed: string[] = []
  for (const { table, column } of tables) {
    const { error } = await adminClient.from(table).delete().eq(column, userId)
    // Ignoramos "tabla no existe" (42P01); cualquier otro error lo registramos.
    if (error && error.code !== '42P01') failed.push(`${table}: ${error.message}`)
  }

  // Si el borrado de datos falló, NO borramos el auth user: evitamos datos
  // huérfanos imposibles de re-asociar. El usuario puede reintentar.
  if (failed.length > 0) {
    return NextResponse.json(
      { error: 'Failed to delete user data', details: failed },
      { status: 500 },
    )
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) {
    return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
