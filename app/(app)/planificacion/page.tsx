import { createClient } from '@/lib/supabase/server'
import PlanificacionClient from './PlanificacionClient'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default async function PlanificacionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: usuarioData } = await supabase.from('usuarios').select('nombre').eq('id', user!.id).maybeSingle()
  const nombre = usuarioData?.nombre?.split(' ')[0] ?? ''

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <PlanificacionClient userId={user!.id} today={todayStr()} nombre={nombre} />
    </div>
  )
}
