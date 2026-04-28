import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import TablizableClient from './TablizableClient'
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
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateStrOffset(today: string, daysBack: number): string {
  const d = new Date(today + 'T12:00:00')
  d.setDate(d.getDate() - daysBack)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDiaLabel() {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const d = new Date()
  return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]}`
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
  const tieneMetas = metasData && (metasData.meta30?.trim() || metasData.meta90?.trim() || metasData.meta180?.trim())
  if (!tieneMetas) redirect('/metas')
  const meta30 = metasData?.meta30 ?? null

  const regMap = Object.fromEntries(registros.map(r => [r.habito_id, { ...r, nota: r.nota ?? null }]))
  const racha = calcularRacha(historial, habitos, today)

  // Task summary
  const tareasVencidas = tareas.filter(t => t.fecha_limite && t.fecha_limite < today).length
  const tareasHoy = tareas.filter(t => t.fecha_limite === today).length
  const tareasTotales = tareas.length
  const tareaColor = tareasVencidas > 0 ? '#ef4444' : tareasHoy > 0 ? '#f59e0b' : tareasHoy === 0 && tareasTotales === 0 ? '#10b981' : '#f472b6'
  const tareaLabel = tareasVencidas > 0 ? `${tareasVencidas} vencida${tareasVencidas > 1 ? 's' : ''}` : tareasHoy > 0 ? `${tareasHoy} para hoy` : tareasTotales === 0 ? 'Al día ✓' : `${tareasTotales} pendiente${tareasTotales > 1 ? 's' : ''}`

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <DiaHeader />
        <SaludoHeader nombre={nombre} />
      </div>

      {/* Mini stats — clickeable */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <Link href="/planificacion?tab=tareas" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#1a1730', borderRadius: '12px',
            border: `1px solid ${tareasVencidas > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.1)'}`,
            padding: '0.875rem 1rem', cursor: 'pointer', transition: 'border-color 0.2s',
          }}>
            <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Tareas</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: tareaColor }}>{tareasTotales === 0 ? '✓' : tareasTotales}</span>
              <span style={{ fontSize: '0.72rem', color: tareaColor }}>{tareaLabel}</span>
            </div>
          </div>
        </Link>

        <Link href="/educacion" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#1a1730', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.1)',
            padding: '0.875rem 1rem', cursor: 'pointer', transition: 'border-color 0.2s',
          }}>
            <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Educación</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#60a5fa' }}>
                {educacionPaso >= 16 ? '🏆' : educacionPaso > 0 ? `Paso ${educacionPaso}` : '—'}
              </span>
              {educacionPaso === 0 && (
                <span style={{ fontSize: '0.72rem', color: '#4b5563' }}>sin iniciar</span>
              )}
              {educacionPaso > 0 && educacionPaso < 16 && (
                <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>en curso</span>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Meta del mes */}
      <Link href="/metas" style={{ textDecoration: 'none', display: 'block', marginBottom: '1rem' }}>
        <div style={{
          background: meta30 ? 'rgba(16,185,129,0.06)' : '#1a1730',
          border: `1px solid ${meta30 ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.1)'}`,
          borderRadius: '12px', padding: '0.875rem 1rem', cursor: 'pointer', transition: 'border-color 0.2s',
        }}>
          <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>⚓ Meta del mes</div>
          <div style={{ color: meta30 ? '#6ee7b7' : '#4b5563', fontSize: '0.85rem', fontWeight: meta30 ? 500 : 400 }}>
            {meta30
              ? (meta30.length > 80 ? meta30.slice(0, 80) + '...' : meta30)
              : 'Definí tu meta del mes →'}
          </div>
        </div>
      </Link>

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
