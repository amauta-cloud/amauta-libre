import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import Link from 'next/link'
import AdminNotasField from '@/components/AdminNotasField'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'amauta.iiaa@gmail.com'

const CATEGORIA_COLORS: Record<string, string> = {
  Salud: '#10b981', Mente: '#8b5cf6', Dinero: '#f59e0b',
  Aprender: '#3b82f6', Social: '#f472b6', General: '#6b7280',
}

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmt(n: number) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function MiniCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.12)', borderRadius: '12px', padding: '1rem' }}>
      <div style={{ fontSize: '0.6rem', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '0.35rem' }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.65rem', color: '#4b5563', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  )
}

export default async function UsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/tablero')

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const todayArg = dateStr(new Date(Date.now() - 3 * 60 * 60 * 1000)) // UTC-3 Argentina
  const today = todayArg
  const hace30 = dateStr(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const hace90 = dateStr(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))

  const [
    usuarioRes,
    habitosRes,
    registros90Res,
    educacionRes,
    metasRes,
    finanzasItemsRes,
    authUserRes,
    tareasRes,
  ] = await Promise.all([
    admin.from('usuarios').select('id, nombre, email').eq('id', id).single(),
    admin.from('habitos').select('id, nombre, emoji, categoria, activo, tipo, dias_semana').eq('usuario_id', id),
    admin.from('habito_registros').select('habito_id, fecha, valor_bool, valor_numero').eq('usuario_id', id).gte('fecha', hace90),
    admin.from('educacion_estado').select('etapa_actual, reflexion_inicial').eq('usuario_id', id).single(),
    admin.from('metas').select('meta30, meta90, meta180').eq('usuario_id', id).single(),
    admin.from('finanzas_items').select('fecha, tipo, monto, categoria').eq('usuario_id', id).gte('fecha', hace30),
    admin.auth.admin.getUserById(id),
    admin.from('tareas').select('estado, fecha_limite').eq('usuario_id', id).neq('estado', 'completada'),
  ])

  if (!usuarioRes.data) redirect('/admin')

  const u = usuarioRes.data
  const habitos = habitosRes.data ?? []
  type RegistroRow = { habito_id: string; fecha: string; valor_bool: boolean | null; valor_numero: number | null }
  const registros90 = (registros90Res.data ?? []) as RegistroRow[]
  const educacion = educacionRes.data
  const metas = metasRes.data
  type FinanzaItem = { fecha: string; tipo: string; monto: number; categoria: string | null }
  const finanzasItems = (finanzasItemsRes.data ?? []) as FinanzaItem[]
  const authUser = authUserRes.data?.user
  type TareaRow = { estado: string; fecha_limite: string | null }
  const tareas = (tareasRes.data ?? []) as TareaRow[]

  const isCompletado = (r: RegistroRow) => r.valor_bool === true || (r.valor_numero !== null && r.valor_numero > 0)

  // Streak — misma lógica que la app: respeta dias_semana + umbral 25% + UTC-3
  type HabitoConDias = { id: string; nombre: string; emoji: string; categoria: string; activo: boolean; tipo: string; dias_semana: number[] | null }
  const habitosActivos = (habitos as HabitoConDias[]).filter(h => h.activo)
  const completadosPorFechaMap: Record<string, number> = {}
  for (const r of registros90) {
    if (isCompletado(r)) {
      completadosPorFechaMap[r.fecha] = (completadosPorFechaMap[r.fecha] ?? 0) + 1
    }
  }
  const esDiaBueno = (fecha: string) => {
    const dow = new Date(fecha + 'T12:00:00').getDay()
    const scheduled = habitosActivos.filter(h => !h.dias_semana || h.dias_semana.length === 0 || h.dias_semana.includes(dow))
    if (scheduled.length === 0) return true
    const threshold = Math.max(1, Math.ceil(scheduled.length * 0.25))
    return (completadosPorFechaMap[fecha] ?? 0) >= threshold
  }
  const offsetDate = (base: string, daysBack: number) => {
    const d = new Date(base + 'T12:00:00')
    d.setDate(d.getDate() - daysBack)
    return dateStr(d)
  }
  // Si hoy no está completo aún, racha empieza en 0 pero el loop sigue contando hacia atrás
  let streak = esDiaBueno(today) ? 1 : 0
  for (let i = 1; i <= 90; i++) {
    if (esDiaBueno(offsetDate(today, i))) streak++
    else break
  }

  // Días activos en 90 días (al menos 1 hábito completado)
  const diasActivos90 = completadosPorFecha.size

  // Actividad diaria (30 días) - para el chart
  const dauArray: { fecha: string; label: string; completado: number; total: number }[] = []
  const regPorFecha: Record<string, { completado: number; total: number }> = {}
  for (const r of registros90) {
    if (r.fecha >= hace30) {
      if (!regPorFecha[r.fecha]) regPorFecha[r.fecha] = { completado: 0, total: 0 }
      regPorFecha[r.fecha].total++
      if (isCompletado(r)) regPorFecha[r.fecha].completado++
    }
  }
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const fecha = dateStr(d)
    const label = i % 7 === 0 ? `${d.getDate()}/${d.getMonth() + 1}` : ''
    dauArray.push({ fecha, label, ...(regPorFecha[fecha] ?? { completado: 0, total: 0 }) })
  }
  const maxDau = Math.max(...dauArray.map(d => d.completado), 1)

  // % cumplimiento por hábito (últimos 30 días)
  const habitoStats: Record<string, { completado: number; total: number }> = {}
  for (const r of registros90) {
    if (r.fecha >= hace30) {
      if (!habitoStats[r.habito_id]) habitoStats[r.habito_id] = { completado: 0, total: 0 }
      habitoStats[r.habito_id].total++
      if (isCompletado(r)) habitoStats[r.habito_id].completado++
    }
  }

  // Finanzas desde items
  const ingresosItems = finanzasItems.filter(i => i.tipo === 'ingreso')
  const gastosItems = finanzasItems.filter(i => i.tipo === 'gasto' && i.categoria !== 'Inversión')
  const inversionItems = finanzasItems.filter(i => i.tipo === 'gasto' && i.categoria === 'Inversión')
  const totalIngresos = ingresosItems.reduce((a, i) => a + i.monto, 0)
  const totalGastos = gastosItems.reduce((a, i) => a + i.monto, 0)
  const totalInversion = inversionItems.reduce((a, i) => a + i.monto, 0)
  const resultado = totalIngresos - totalGastos - totalInversion
  const diasConFinanzas = new Set(finanzasItems.map(i => i.fecha)).size

  // Tareas
  const today2 = today
  const tareasVencidas = tareas.filter(t => t.fecha_limite && t.fecha_limite < today2).length
  const tareasHoy = tareas.filter(t => t.fecha_limite === today2).length
  const tareasTotales = tareas.length

  const registrado = authUser?.created_at
    ? new Date(authUser.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  const habitosActivos = habitos.filter(h => h.activo)

  return (
    <div style={{ minHeight: '100vh', background: '#0f0d1a', padding: '2rem 1rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link href="/admin" style={{ color: '#6b7280', fontSize: '0.72rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.75rem' }}>
            ← Panel admin
          </Link>
          <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            {u.nombre || 'Sin nombre'}
          </h1>
          <p style={{ color: '#4b5563', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            {u.email} · Registrado el {registrado}
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <MiniCard label="Racha actual" value={streak > 0 ? `${streak}d` : '0'} color={streak >= 30 ? '#f59e0b' : streak >= 7 ? '#a78bfa' : '#6b7280'} sub={streak >= 7 ? '🔥 activo' : streak > 0 ? '⚡ activo' : 'sin racha'} />
          <MiniCard label="Días activo (90d)" value={String(diasActivos90)} color="#10b981" sub="con al menos 1 hábito" />
          <MiniCard label="Hábitos activos" value={String(habitosActivos.length)} color="#60a5fa" sub={`${habitos.length} total`} />
          <MiniCard label="Aprendizaje" value={`${educacion?.etapa_actual ?? 0}/16`} color={educacion?.etapa_actual === 16 ? '#10b981' : '#F5C518'} sub={educacion?.etapa_actual === 16 ? 'Completado ✓' : 'en progreso'} />
          <MiniCard label="Metas escritas" value={metas ? '✓' : '—'} color={metas?.meta30 ? '#10b981' : '#374151'} sub={metas?.meta30 ? 'tiene metas' : 'sin metas aún'} />
          <MiniCard
            label="Tareas pendientes"
            value={tareasTotales === 0 ? '✓' : String(tareasTotales)}
            color={tareasVencidas > 0 ? '#ef4444' : tareasHoy > 0 ? '#f59e0b' : tareasTotales === 0 ? '#10b981' : '#6b7280'}
            sub={tareasVencidas > 0 ? `${tareasVencidas} vencida${tareasVencidas > 1 ? 's' : ''}` : tareasHoy > 0 ? `${tareasHoy} para hoy` : tareasTotales === 0 ? 'al día ✓' : 'sin vencer'}
          />
        </div>

        {/* Activity chart */}
        <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>Actividad diaria</h2>
            <span style={{ color: '#4b5563', fontSize: '0.68rem' }}>últimos 30 días · hábitos completados</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '70px' }}>
            {dauArray.map((d) => {
              const pct = maxDau > 0 ? (d.completado / maxDau) * 100 : 0
              const isToday = d.fecha === today
              return (
                <div key={d.fecha} title={`${d.fecha}: ${d.completado}/${d.total}`} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{
                    width: '100%',
                    height: `${Math.max(pct, d.completado > 0 ? 5 : 2)}%`,
                    borderRadius: '3px 3px 0 0',
                    background: isToday ? '#a78bfa' : d.completado > 0 ? '#7c3aed' : 'rgba(255,255,255,0.04)',
                    minHeight: '2px',
                  }} />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
            {dauArray.map((d) => (
              <div key={d.fecha} style={{ flex: 1, textAlign: 'center', fontSize: '0.52rem', color: '#4b5563', overflow: 'hidden' }}>
                {d.label}
              </div>
            ))}
          </div>
        </div>

        {/* Hábitos + Educación row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

          {/* Hábitos con % cumplimiento */}
          <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem' }}>
            <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
              Hábitos — últimos 30 días
            </h2>
            {habitosActivos.length === 0 ? (
              <p style={{ color: '#4b5563', fontSize: '0.78rem', margin: 0 }}>Sin hábitos configurados</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {habitosActivos.map(h => {
                  const stats = habitoStats[(h as any).id] ?? { completado: 0, total: 0 }
                  const pct = stats.total > 0 ? Math.round((stats.completado / stats.total) * 100) : 0
                  const color = CATEGORIA_COLORS[h.categoria] ?? '#6b7280'
                  return (
                    <div key={(h as any).id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>{h.emoji}</span>
                          {h.nombre}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: pct >= 70 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444' }}>
                          {pct}%
                        </span>
                      </div>
                      <div style={{ height: '3px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)' }}>
                        <div style={{ height: '100%', borderRadius: '99px', background: color, width: `${pct}%` }} />
                      </div>
                      <div style={{ fontSize: '0.6rem', color: '#374151', marginTop: '0.15rem' }}>
                        {stats.completado}/{stats.total} días
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Aprendizaje */}
          <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem' }}>
            <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Aprendizaje</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {Array.from({ length: 16 }, (_, i) => {
                const paso = i + 1
                const completado = (educacion?.etapa_actual ?? 0) >= paso
                return (
                  <div key={paso} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                      background: completado ? '#7c3aed' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${completado ? '#7c3aed' : 'rgba(255,255,255,0.08)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: '0.55rem', color: completado ? '#fff' : '#374151', fontWeight: 700 }}>
                        {completado ? '✓' : paso}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: completado ? '#d1d5db' : '#374151' }}>
                      Paso {paso}
                    </span>
                  </div>
                )
              })}
            </div>
            {educacion?.reflexion_inicial && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(124,58,237,0.08)', borderRadius: '8px', borderLeft: '2px solid rgba(124,58,237,0.4)' }}>
                <div style={{ fontSize: '0.6rem', color: '#6b7280', marginBottom: '0.35rem', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Reflexión inicial</div>
                <p style={{ fontSize: '0.72rem', color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>
                  {String(educacion.reflexion_inicial).slice(0, 200)}{String(educacion.reflexion_inicial).length > 200 ? '...' : ''}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Metas + Finanzas row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

          {/* Metas */}
          <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem' }}>
            <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Metas</h2>
            {!metas ? (
              <p style={{ color: '#4b5563', fontSize: '0.78rem', margin: 0 }}>Sin metas definidas todavía</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: '30 días', value: metas.meta30, color: '#10b981' },
                  { label: '90 días', value: metas.meta90, color: '#a78bfa' },
                  { label: '180 días', value: metas.meta180, color: '#f59e0b' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.6rem', color, textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 700, marginBottom: '0.3rem' }}>
                      Meta {label}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: value ? '#d1d5db' : '#374151', margin: 0, lineHeight: 1.5 }}>
                      {value ? String(value).slice(0, 180) : 'Sin escribir'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Finanzas */}
          <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem' }}>
            <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
              Finanzas — últimos 30 días
            </h2>
            {diasConFinanzas === 0 ? (
              <p style={{ color: '#4b5563', fontSize: '0.78rem', margin: 0 }}>Sin registros financieros</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>📈 Ingresos</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>${fmt(totalIngresos)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>📉 Gastos</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>${fmt(totalGastos)}</span>
                </div>
                {totalInversion > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>📈 Inversión</span>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#F5C518' }}>${fmt(totalInversion)}</span>
                  </div>
                )}
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.15rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>Resultado</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: resultado >= 0 ? '#10b981' : '#ef4444' }}>
                    {resultado >= 0 ? '+' : ''}{fmt(resultado)}
                  </span>
                </div>
                <div style={{ fontSize: '0.65rem', color: '#374151', marginTop: '0.15rem' }}>
                  {diasConFinanzas} días con registros · {finanzasItems.length} movimientos
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Notas del admin */}
        <AdminNotasField usuarioId={id} />

      </div>
    </div>
  )
}
