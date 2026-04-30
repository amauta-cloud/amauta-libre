import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import TablizableClient from './TablizableClient'
import TableroMiniCards from './TableroMiniCards'
import SaludoHeader from '@/components/SaludoHeader'
import DiaHeader from '@/components/DiaHeader'

type Habito = {
  id: string
  nombre: string
  emoji: string
  tipo: string
  unidad: string | null
  obligatorio: boolean
  orden: number
  meta_numero: number | null
  categoria?: string | null
  dias_semana?: number[] | null
}

type Registro = {
  habito_id: string
  valor_bool: boolean | null
  valor_numero: number | null
  nota?: string | null
}

type RegistroHistorial = {
  habito_id: string
  fecha: string
  valor_bool: boolean | null
  valor_numero: number | null
}

type TareaResumen = {
  estado: string
  fecha_limite: string | null
}

function todayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
}

function dateStrOffset(today: string, daysBack: number): string {
  const d = new Date(today + 'T12:00:00')
  d.setDate(d.getDate() - daysBack)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}


function calcularRacha(historial: RegistroHistorial[], habitos: Habito[], today: string): number {
  if (habitos.length === 0) return 0
  const completadosPorFecha: Record<string, number> = {}
  for (const r of historial) {
    const completado = r.valor_bool === true || (r.valor_numero !== null && r.valor_numero > 0)
    if (completado) completadosPorFecha[r.fecha] = (completadosPorFecha[r.fecha] || 0) + 1
  }
  const esDiaBueno = (fecha: string) => {
    const dow = new Date(fecha + 'T12:00:00').getDay()
    const scheduled = habitos.filter(h => !h.dias_semana || h.dias_semana.length === 0 || h.dias_semana.includes(dow))
    if (scheduled.length === 0) return true
    const threshold = Math.max(1, Math.ceil(scheduled.length * 0.25))
    return (completadosPorFecha[fecha] || 0) >= threshold
  }
  let racha = 0
  if (esDiaBueno(today)) racha = 1
  for (let i = 1; i <= 60; i++) {
    const fecha = dateStrOffset(today, i)
    if (esDiaBueno(fecha)) racha++
    else break
  }
  return racha
}

export default async function TablizablePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const cookieStore = await cookies()
  const today = cookieStore.get('amauta-date')?.value || todayStr()
  const hace60dias = dateStrOffset(today, 60)

  const [habitosRes, registrosRes, historialRes, tareasRes, educacionRes, usuarioRes, metasRes] = await Promise.all([
    supabase.from('habitos').select('*').eq('usuario_id', user!.id).eq('activo', true).order('orden'),
    supabase.from('habito_registros').select('habito_id,valor_bool,valor_numero,nota').eq('usuario_id', user!.id).eq('fecha', today),
    supabase.from('habito_registros').select('habito_id,fecha,valor_bool,valor_numero').eq('usuario_id', user!.id).gte('fecha', hace60dias),
    supabase.from('tareas').select('estado,fecha_limite').eq('usuario_id', user!.id).neq('estado', 'completada'),
    supabase.from('educacion_estado').select('etapa_actual').eq('usuario_id', user!.id).maybeSingle().then(r => r.error ? { data: null } : r),
    supabase.from('usuarios').select('nombre').eq('id', user!.id).maybeSingle(),
    supabase.from('metas').select('meta30,meta90,meta180').eq('usuario_id', user!.id).maybeSingle().then(r => r.error ? { data: null } : r),
  ])

  const habitos: Habito[] = habitosRes.data || []
  const registros: Registro[] = registrosRes.data || []
  const historial: RegistroHistorial[] = historialRes.data || []
  const tareas: TareaResumen[] = tareasRes.data || []
  const educacionPaso = educacionRes.data?.etapa_actual ?? 0
  const nombre = usuarioRes.data?.nombre?.split(' ')[0] ?? ''
  type MetasData = { meta30: string; meta90: string; meta180: string } | null
  const metasData = (metasRes as { data: MetasData }).data
  const meta30 = metasData?.meta30 ?? null

  const regMap = Object.fromEntries(registros.map(r => [r.habito_id, { ...r, nota: r.nota ?? null }]))
  const racha = calcularRacha(historial, habitos, today)

  // Task summary
  const tareasVencidas = tareas.filter(t => t.fecha_limite && t.fecha_limite < today).length
  const tareasHoy = tareas.filter(t => t.fecha_limite === today).length
  const tareasTotales = tareas.length
  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <DiaHeader />
        <SaludoHeader nombre={nombre} />
      </div>

      <TableroMiniCards
        tareasVencidas={tareasVencidas}
        tareasHoy={tareasHoy}
        tareasTotales={tareasTotales}
        educacionPaso={educacionPaso}
        meta30={meta30}
      />

      {/* Tablero completo */}
      <TablizableClient
        habitos={habitos}
        regMap={regMap}
        userId={user!.id}
        today={today}
        racha={racha}
        metas={metasData}
        historial={historial}
        nombre={nombre}
      />
    </div>
  )
}
