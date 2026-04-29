import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import Link from 'next/link'
import AdminPushButton from '@/components/AdminPushButton'
import AdminUsuariosTable from '@/components/AdminUsuariosTable'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'amauta.iiaa@gmail.com'

const CATEGORIA_COLORS: Record<string, string> = {
  Salud: '#10b981',
  Mente: '#8b5cf6',
  Dinero: '#f59e0b',
  Aprender: '#3b82f6',
  Social: '#f472b6',
  General: '#6b7280',
}

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmt(n: number) {
  return n.toLocaleString('es-AR')
}

function tendencia(actual: number, anterior: number): { pct: number; up: boolean } | null {
  if (anterior === 0) return null
  const pct = Math.round(((actual - anterior) / anterior) * 100)
  return { pct, up: pct >= 0 }
}

function StatCard({ label, value, color, sub, trend }: {
  label: string; value: string; color: string; sub: string
  trend?: { pct: number; up: boolean } | null
}) {
  return (
    <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '14px', padding: '1.25rem' }}>
      <div style={{ fontSize: '0.62rem', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        {trend && (
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: trend.up ? '#10b981' : '#ef4444' }}>
            {trend.up ? '▲' : '▼'} {Math.abs(trend.pct)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '0.3rem' }}>{sub}</div>
    </div>
  )
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/tablero')

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const nowArg = new Date(Date.now() - 3 * 60 * 60 * 1000) // UTC-3 Argentina
  const today = dateStr(nowArg)
  const hace7 = dateStr(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const hace14 = dateStr(new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))
  const hace30 = dateStr(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const hace90 = dateStr(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))

  const [
    usuariosRes,
    activosHoyRes,
    activos7Res,
    activos30Res,
    pushSubsRes,
    habitosRes,
    educacionRes,
    registros90Res,
    authUsersRes,
    registrosHoyRes,
    soporteRes,
    finanzasRes,
    metasRes,
  ] = await Promise.all([
    admin.from('usuarios').select('id, nombre, email'),
    admin.from('habito_registros').select('usuario_id').eq('fecha', today),
    admin.from('habito_registros').select('usuario_id').gte('fecha', hace7),
    admin.from('habito_registros').select('usuario_id').gte('fecha', hace30),
    admin.from('push_subscriptions').select('usuario_id').then(r => r.error ? { data: [] as { usuario_id: string }[] } : r),
    admin.from('habitos').select('id, nombre, emoji, categoria, usuario_id').eq('activo', true),
    admin.from('educacion_estado').select('usuario_id, etapa_actual'),
    admin.from('habito_registros').select('usuario_id, fecha, valor_bool, valor_numero').gte('fecha', hace90),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from('habito_registros').select('usuario_id, habito_id, valor_bool, valor_numero').eq('fecha', today).limit(500),
    admin.from('soporte_mensajes').select('id, usuario_id, mensaje, categoria, creado_en').order('creado_en', { ascending: false }).limit(50).then(r => r.error ? { data: [] as { id: string; usuario_id: string; mensaje: string; categoria: string; creado_en: string }[] } : r),
    admin.from('finanzas_items').select('usuario_id').then(r => r.error ? { data: [] as { usuario_id: string }[] } : r),
    admin.from('metas').select('usuario_id').then(r => r.error ? { data: [] as { usuario_id: string }[] } : r),
  ])

  const usuarios = usuariosRes.data ?? []
  const totalUsuarios = usuarios.length
  const soporteMensajes = soporteRes.data ?? []
  const emailMap = Object.fromEntries(usuarios.map(u => [u.id, u.email || u.nombre || '?']))
  const emailOnlyMap = Object.fromEntries(usuarios.map(u => [u.id, u.email ?? '']))
  const usuariosConFinanzas = new Set((finanzasRes.data ?? []).map(r => r.usuario_id)).size
  const pctFinanzas = totalUsuarios > 0 ? Math.round((usuariosConFinanzas / totalUsuarios) * 100) : 0

  const activosHoy = new Set((activosHoyRes.data ?? []).map(r => r.usuario_id)).size
  const activos7 = new Set((activos7Res.data ?? []).map(r => r.usuario_id)).size
  const activos30 = new Set((activos30Res.data ?? []).map(r => r.usuario_id)).size
  const pushSubs = (pushSubsRes.data ?? []).length

  const authUsers = authUsersRes.data?.users ?? []
  const hace7Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const hace14Date = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const hace30Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const nuevos7 = authUsers.filter(u => new Date(u.created_at) > hace7Date).length
  const nuevos7Ant = authUsers.filter(u => {
    const d = new Date(u.created_at)
    return d > hace14Date && d <= hace7Date
  }).length
  const nuevos30 = authUsers.filter(u => new Date(u.created_at) > hace30Date).length
  const tendenciaNuevos = tendencia(nuevos7, nuevos7Ant)

  // Top hábitos por cantidad de usuarios
  const habitoCount: Record<string, { emoji: string; count: number }> = {}
  for (const h of (habitosRes.data ?? [])) {
    if (!habitoCount[h.nombre]) habitoCount[h.nombre] = { emoji: h.emoji, count: 0 }
    habitoCount[h.nombre].count++
  }
  const topHabitos = Object.entries(habitoCount)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)

  // Distribución de categorías
  const catCount: Record<string, number> = {}
  for (const h of (habitosRes.data ?? [])) {
    const cat = h.categoria ?? 'General'
    catCount[cat] = (catCount[cat] ?? 0) + 1
  }
  const totalHabitos = Object.values(catCount).reduce((a, b) => a + b, 0)
  const catOrdenadas = Object.entries(catCount)
    .sort((a, b) => b[1] - a[1])

  // Aprendizaje (educación)
  const completadosEdu = (educacionRes.data ?? []).filter(e => e.etapa_actual >= 16).length
  const pctEdu = totalUsuarios > 0 ? Math.round((completadosEdu / totalUsuarios) * 100) : 0
  const retencion7 = totalUsuarios > 0 ? Math.round((activos7 / totalUsuarios) * 100) : 0
  const retencionColor = retencion7 >= 40 ? '#10b981' : retencion7 >= 20 ? '#f59e0b' : '#ef4444'

  // Embudo de conversión
  const usuariosConHabitos = new Set((habitosRes.data ?? []).map((h: any) => h.usuario_id)).size
  const usuariosConMetas = new Set((metasRes.data ?? []).map(r => r.usuario_id)).size
  const embudoSteps = [
    { label: 'Registrados', value: totalUsuarios, color: '#a78bfa' },
    { label: 'Con hábitos', value: usuariosConHabitos, color: '#60a5fa' },
    { label: 'Con metas', value: usuariosConMetas, color: '#34d399' },
    { label: 'Aprendizaje completo', value: completadosEdu, color: '#F5C518' },
    { label: 'Activos 30d', value: activos30, color: '#10b981' },
  ]

  // DAU chart: últimos 30 días
  const registros90 = registros90Res.data ?? []
  const dauPorFecha: Record<string, Set<string>> = {}
  for (const r of registros90) {
    if (r.fecha >= hace30) {
      if (!dauPorFecha[r.fecha]) dauPorFecha[r.fecha] = new Set()
      dauPorFecha[r.fecha].add(r.usuario_id)
    }
  }
  const dauArray: { fecha: string; label: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const fecha = dateStr(d)
    const label = i % 7 === 0 ? `${d.getDate()}/${d.getMonth() + 1}` : ''
    dauArray.push({ fecha, label, count: dauPorFecha[fecha]?.size ?? 0 })
  }
  const maxDau = Math.max(...dauArray.map(d => d.count), 1)

  // Última actividad por usuario (90 días)
  const ultimaActMap: Record<string, string> = {}
  for (const r of registros90) {
    if (!ultimaActMap[r.usuario_id] || r.fecha > ultimaActMap[r.usuario_id]) {
      ultimaActMap[r.usuario_id] = r.fecha
    }
  }

  const dormidos = usuarios.filter(u => {
    const ultima = ultimaActMap[u.id]
    return ultima && ultima < hace30
  }).length

  // Habitos map id → { nombre, emoji }
  type HabitoRow = { id: string; nombre: string; emoji: string; categoria: string }
  const habitosMap: Record<string, { nombre: string; emoji: string }> = {}
  for (const h of (habitosRes.data ?? []) as HabitoRow[]) {
    habitosMap[h.id] = { nombre: h.nombre, emoji: h.emoji }
  }

  // Registros completados hoy por usuario (solo completados reales)
  type RegRow = { usuario_id: string; habito_id: string; valor_bool: boolean | null; valor_numero: number | null }
  const registrosHoy = ((registrosHoyRes as any).data ?? []) as RegRow[]
  const hoyPorUsuario: Record<string, RegRow[]> = {}
  for (const r of registrosHoy) {
    const completado = r.valor_bool === true || (r.valor_numero !== null && r.valor_numero > 0)
    if (!completado) continue
    if (!hoyPorUsuario[r.usuario_id]) hoyPorUsuario[r.usuario_id] = []
    hoyPorUsuario[r.usuario_id].push(r)
  }

  // Rachas para todos los usuarios — misma lógica que la app (al menos 1 hábito completado, UTC-3)
  const userDateSets: Record<string, Set<string>> = {}
  for (const r of registros90 as { usuario_id: string; fecha: string; valor_bool: boolean | null; valor_numero: number | null }[]) {
    const completado = r.valor_bool === true || (r.valor_numero !== null && r.valor_numero > 0)
    if (completado) {
      if (!userDateSets[r.usuario_id]) userDateSets[r.usuario_id] = new Set()
      userDateSets[r.usuario_id].add(r.fecha)
    }
  }
  const streakMap: Record<string, number> = {}
  for (const u of usuarios) {
    const fechas = userDateSets[u.id] ?? new Set<string>()
    // Si hoy no está completo aún, empieza en 0 pero sigue contando días anteriores
    let streak = fechas.has(today) ? 1 : 0
    for (let i = 1; i <= 90; i++) {
      const d = new Date(Date.now() - 3 * 60 * 60 * 1000 - i * 24 * 60 * 60 * 1000)
      const f = dateStr(d)
      if (fechas.has(f)) streak++
      else break
    }
    streakMap[u.id] = streak
  }
  const rachasData = usuarios
    .filter(u => streakMap[u.id] > 0)
    .sort((a, b) => (streakMap[b.id] ?? 0) - (streakMap[a.id] ?? 0))
    .slice(0, 8)
    .map(u => ({ ...u, streak: streakMap[u.id] }))

  // Educación por usuario
  const eduMap: Record<string, number> = {}
  for (const e of (educacionRes.data ?? [])) {
    eduMap[e.usuario_id] = e.etapa_actual
  }

  const usuariosTabla = usuarios
    .map(u => ({
      ...u,
      ultimaActividad: ultimaActMap[u.id] ?? null,
      authUser: authUsers.find(a => a.id === u.id) ? { created_at: authUsers.find(a => a.id === u.id)!.created_at } : null,
      streak: streakMap[u.id] ?? 0,
      habitosHoy: hoyPorUsuario[u.id]?.length ?? 0,
      educacionEtapa: eduMap[u.id] ?? 0,
    }))
    .sort((a, b) => {
      if (!a.ultimaActividad && !b.ultimaActividad) return 0
      if (!a.ultimaActividad) return 1
      if (!b.ultimaActividad) return -1
      return b.ultimaActividad.localeCompare(a.ultimaActividad)
    })

  return (
    <div style={{ minHeight: '100vh', background: '#0f0d1a', padding: '2rem 1rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem' }}>
          <div>
            <p style={{ color: '#7c3aed', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
              Amauta Libre — Admin
            </p>
            <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Panel de control</h1>
            <p style={{ color: '#4b5563', fontSize: '0.78rem', marginTop: '0.25rem' }}>{today} · <span style={{ color: '#6b7280' }}>v1.21.0</span></p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem', flexShrink: 0 }}>
            <AdminPushButton totalSubs={pushSubs} />
            <Link href="/tablero" style={{ fontSize: '0.78rem', color: '#6b7280', textDecoration: 'none', padding: '0.4rem 0.75rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', whiteSpace: 'nowrap' }}>
              ← App
            </Link>
          </div>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <StatCard label="Total usuarios" value={fmt(totalUsuarios)} color="#a78bfa" sub="registrados" />
          <StatCard label="Activos hoy" value={fmt(activosHoy)} color="#10b981" sub="registraron hábitos" />
          <StatCard label="Activos 7 días" value={fmt(activos7)} color="#34d399" sub={`${retencion7}% retención`} />
          <StatCard label="Nuevos 7 días" value={fmt(nuevos7)} color="#60a5fa" sub={`${fmt(nuevos30)} en 30 días`} trend={tendenciaNuevos} />
          <StatCard label="Push subs" value={fmt(pushSubs)} color="#f59e0b" sub="notificaciones activas" />
          <StatCard label="Usan finanzas" value={`${pctFinanzas}%`} color="#10b981" sub={`${usuariosConFinanzas} de ${totalUsuarios} usuarios`} />
        </div>

        {/* Alerta dormidos */}
        {dormidos > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
            <div>
              <span style={{ color: '#fca5a5', fontSize: '0.82rem', fontWeight: 600 }}>{dormidos} usuario{dormidos > 1 ? 's' : ''} sin actividad en más de 30 días</span>
              <span style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: '0.5rem' }}>candidatos para campaña de reactivación</span>
            </div>
          </div>
        )}

        {/* DAU Chart — actividad diaria 30 días */}
        <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>Usuarios activos por día</h2>
            <span style={{ color: '#4b5563', fontSize: '0.68rem' }}>últimos 30 días</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
            {dauArray.map((d) => {
              const pct = maxDau > 0 ? (d.count / maxDau) * 100 : 0
              const isToday = d.fecha === today
              return (
                <div key={d.fecha} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '100%', justifyContent: 'flex-end' }}>
                  <div
                    title={`${d.fecha}: ${d.count} usuario${d.count !== 1 ? 's' : ''}`}
                    style={{
                      width: '100%',
                      height: `${Math.max(pct, d.count > 0 ? 4 : 2)}%`,
                      borderRadius: '3px 3px 0 0',
                      background: isToday ? '#a78bfa' : d.count > 0 ? '#7c3aed' : 'rgba(255,255,255,0.04)',
                      minHeight: '2px',
                      transition: 'height 0.2s',
                    }}
                  />
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', marginTop: '4px' }}>
            {dauArray.map((d) => (
              <div key={d.fecha} style={{ flex: 1, textAlign: 'center', fontSize: '0.55rem', color: '#4b5563', overflow: 'hidden' }}>
                {d.label}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>Pico: {maxDau} usuario{maxDau !== 1 ? 's' : ''}</span>
            <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>Promedio: {dauArray.length > 0 ? Math.round(dauArray.reduce((a, d) => a + d.count, 0) / dauArray.length) : 0} / día</span>
          </div>
        </div>

        {/* Tablero hoy + Rachas activas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

          {/* Tablero hoy */}
          <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.875rem' }}>
              <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>Tablero hoy</h2>
              <span style={{ color: '#4b5563', fontSize: '0.68rem' }}>{activosHoy}/{totalUsuarios} activos</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '0.4rem' }}>
              {usuarios.map(u => {
                const regs = hoyPorUsuario[u.id]
                const activo = !!regs && regs.length > 0
                const emojis = regs?.slice(0, 4).map(r => habitosMap[r.habito_id]?.emoji ?? '').filter(Boolean).join('') ?? ''
                return (
                  <Link
                    key={u.id}
                    href={`/admin/usuario/${u.id}`}
                    title={`${u.nombre || u.email}: ${regs?.length ?? 0} hábitos hoy`}
                    style={{
                      padding: '0.3rem 0.55rem',
                      borderRadius: '8px',
                      background: activo ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${activo ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
                      display: 'flex', alignItems: 'center', gap: '0.35rem',
                      textDecoration: 'none', cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '0.6rem', color: activo ? '#10b981' : '#374151', flexShrink: 0 }}>
                      {activo ? '✓' : '·'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: activo ? '#d1d5db' : '#4b5563', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {u.nombre?.split(' ')[0] || (u.email as string)?.split('@')[0] || '—'}
                    </span>
                    {activo && emojis && (
                      <span style={{ fontSize: '0.65rem', flexShrink: 0 }}>{emojis}</span>
                    )}
                  </Link>
                )
              })}
              {usuarios.length === 0 && (
                <p style={{ color: '#4b5563', fontSize: '0.78rem', margin: 0 }}>Sin usuarios</p>
              )}
            </div>
          </div>

          {/* Rachas activas */}
          <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem' }}>
            <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: '0 0 0.875rem 0' }}>Rachas activas</h2>
            {rachasData.length === 0 ? (
              <p style={{ color: '#4b5563', fontSize: '0.78rem', margin: 0 }}>Sin rachas activas hoy</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {rachasData.map((u, i) => {
                  const pct = Math.round((u.streak / (rachasData[0]?.streak ?? 1)) * 100)
                  const color = u.streak >= 30 ? '#f59e0b' : u.streak >= 7 ? '#a78bfa' : '#6b7280'
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '0.6rem', color: '#374151', width: '0.875rem', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: '0.75rem', color: '#d1d5db', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {u.nombre?.split(' ')[0] || (u.email as string | null)?.split('@')[0] || '—'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                        <div style={{ width: '60px', height: '3px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)' }}>
                          <div style={{ height: '100%', borderRadius: '99px', background: color, width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color, width: '2.5rem', textAlign: 'right' }}>
                          {u.streak >= 7 ? '🔥' : '⚡'} {u.streak}d
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* Top hábitos + Categorías + Engagement */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

          {/* Top hábitos */}
          <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem' }}>
            <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Hábitos más usados</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {topHabitos.length === 0 && <p style={{ color: '#4b5563', fontSize: '0.78rem', margin: 0 }}>Sin datos aún</p>}
              {topHabitos.map(([nombre, { emoji, count }]) => (
                <div key={nombre} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', width: '1.5rem', flexShrink: 0 }}>{emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.77rem', color: '#d1d5db' }}>{nombre}</span>
                      <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{count}</span>
                    </div>
                    <div style={{ height: '3px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ height: '100%', borderRadius: '99px', background: '#7c3aed', width: `${Math.round((count / (topHabitos[0]?.[1]?.count ?? 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Categorías */}
          <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem' }}>
            <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Hábitos por categoría</h2>
            {catOrdenadas.length === 0 ? (
              <p style={{ color: '#4b5563', fontSize: '0.78rem', margin: 0 }}>Sin datos aún</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {catOrdenadas.map(([cat, count]) => {
                  const pct = totalHabitos > 0 ? Math.round((count / totalHabitos) * 100) : 0
                  const color = CATEGORIA_COLORS[cat] ?? '#6b7280'
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.77rem', color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                          {cat}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: '3px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)' }}>
                        <div style={{ height: '100%', borderRadius: '99px', background: color, width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
                <p style={{ fontSize: '0.65rem', color: '#4b5563', margin: '0.25rem 0 0 0' }}>{fmt(totalHabitos)} hábitos activos en total</p>
              </div>
            )}
          </div>

          {/* Engagement cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem', flex: 1 }}>
              <div style={{ fontSize: '0.62rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Retención 7 días</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: retencionColor, lineHeight: 1 }}>{totalUsuarios > 0 ? `${retencion7}%` : '—'}</div>
              <div style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '0.3rem' }}>{activos7} de {totalUsuarios} usuarios</div>
              <div style={{ height: '3px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', marginTop: '0.6rem' }}>
                <div style={{ height: '100%', borderRadius: '99px', background: retencionColor, width: `${Math.min(100, retencion7)}%` }} />
              </div>
            </div>
            <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem', flex: 1 }}>
              <div style={{ fontSize: '0.62rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Activos 30 días</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a78bfa', lineHeight: 1 }}>{totalUsuarios > 0 ? `${Math.round((activos30 / totalUsuarios) * 100)}%` : '—'}</div>
              <div style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '0.3rem' }}>{activos30} de {totalUsuarios} usuarios</div>
            </div>
            <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem', flex: 1 }}>
              <div style={{ fontSize: '0.62rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Aprendizaje completado</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F5C518', lineHeight: 1 }}>{pctEdu}%</div>
              <div style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '0.3rem' }}>{completadosEdu} de {totalUsuarios} usuarios</div>
            </div>
          </div>
        </div>

        {/* Embudo de conversión */}
        <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Embudo de conversión</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {embudoSteps.map((step, i) => {
              const pct = embudoSteps[0].value > 0 ? Math.round((step.value / embudoSteps[0].value) * 100) : 0
              const dropPct = i > 0 && embudoSteps[i - 1].value > 0
                ? Math.round(((embudoSteps[i - 1].value - step.value) / embudoSteps[i - 1].value) * 100)
                : null
              return (
                <div key={step.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.6rem', color: '#4b5563', width: '1rem' }}>{i + 1}</span>
                      <span style={{ fontSize: '0.78rem', color: '#d1d5db' }}>{step.label}</span>
                      {dropPct !== null && dropPct > 0 && (
                        <span style={{ fontSize: '0.62rem', color: '#ef4444', fontWeight: 600 }}>-{dropPct}%</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: step.color }}>{fmt(step.value)}</span>
                      <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ height: '100%', borderRadius: '99px', background: step.color, width: `${pct}%`, transition: 'width 0.4s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tabla usuarios — client component con search + CSV */}
        <div style={{ marginBottom: '1.5rem' }}>
          <AdminUsuariosTable usuarios={usuariosTabla} hace7={hace7} hace30={hace30} />
        </div>

        {/* Mensajes de soporte */}
        <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '1rem' }}>
            💬 Mensajes de soporte ({soporteMensajes.length})
          </div>
          {soporteMensajes.length === 0 ? (
            <div style={{ color: '#4b5563', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem' }}>Sin mensajes todavía</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '0.75rem' }}>
              {soporteMensajes.map(m => {
                const catColor = m.categoria === 'bug' ? '#ef4444' : m.categoria === 'sugerencia' ? '#8b5cf6' : '#6b7280'
                const fecha = new Date(m.creado_en)
                const fechaStr = `${fecha.toLocaleDateString('es-AR')} ${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
                const userEmail = emailOnlyMap[m.usuario_id] ?? ''
                const userDisplay = emailMap[m.usuario_id] || m.usuario_id
                const mailtoBody = encodeURIComponent(`Hola! Vi tu mensaje en Amauta Libre: "${m.mensaje.slice(0, 100)}"\n\n`)
                const mailtoHref = userEmail ? `mailto:${userEmail}?subject=Re: tu mensaje en Amauta Libre&body=${mailtoBody}` : ''
                return (
                  <div key={m.id} style={{ padding: '0.875rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: catColor, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                        {m.categoria === 'bug' ? '🐛 Bug' : m.categoria === 'sugerencia' ? '💡 Idea' : '💬 Otro'}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>{fechaStr}</span>
                    </div>
                    <p style={{ margin: '0 0 0.5rem', color: '#d1d5db', fontSize: '0.85rem', lineHeight: 1.5 }}>{m.mensaje}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 500 }}>{userDisplay}</div>
                      {mailtoHref && (
                        <a
                          href={mailtoHref}
                          style={{
                            fontSize: '0.7rem', color: '#a78bfa', textDecoration: 'none',
                            padding: '0.2rem 0.6rem', borderRadius: '6px',
                            border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)',
                            fontWeight: 600,
                          }}
                        >
                          ↩ Responder
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
