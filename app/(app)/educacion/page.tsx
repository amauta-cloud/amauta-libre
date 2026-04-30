import { createClient } from '@/lib/supabase/server'
import EducacionClient from './EducacionClient'

type Etapa = {
  id: string
  orden: number
  titulo: string
  descripcion: string | null
  tipo: string
  contenido: string | null
  duracion_min: number | null
}

export default async function EducacionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data }, { data: perfil }] = await Promise.all([
    supabase.from('educacion_etapas').select('*').eq('activo', true).order('orden'),
    supabase.from('usuarios').select('nombre').eq('id', user!.id).maybeSingle(),
  ])

  const etapas: Etapa[] = data || []
  const nombre = perfil?.nombre || user?.user_metadata?.full_name || user?.user_metadata?.name || ''

  return (
    <EducacionClient
      etapas={etapas}
      userId={user!.id}
      nombre={nombre}
    />
  )
}
