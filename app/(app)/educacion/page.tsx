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

  const { data } = await supabase
    .from('educacion_etapas')
    .select('*')
    .eq('activo', true)
    .order('orden')

  const etapas: Etapa[] = data || []

  return (
    <EducacionClient
      etapas={etapas}
      userId={user!.id}
    />
  )
}
