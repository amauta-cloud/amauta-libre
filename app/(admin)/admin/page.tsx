import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'amauta.iiaa@gmail.com'

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmt(n: number) {
  return n.toLocaleString('es-AR')
}

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub: string }) {
  return (
    <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '14px', padding: '1.25rem' }}>
      <div style={{ fontSize: '0.62rem', color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
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

  const today = dateStr(new Date())
  const hace7 = dateStr(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
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
    ultimaActRes,
    authUsersRes,
  ] = await Promise.all([
    admin.from('usuarios').select('id, nombre, email'),
    admin.from('habito_registros').select('usuario_id').eq('fecha', today),
    admin.from('habito_registros').select('usuario_id').gte('fecha', hace7),
    admin.from('habito_registros').select('usuario_id').gte('fecha', hace30),
    admin.from('push_subscriptions').select('usuario_id').then(r => r.error ? { data: [] as { usuario_id: string }[] } : r),
    admin.from('habitos').select('nombre, emoji').eq('activo', true),
    admin.from('educacion_estado').select('usuario_id, etapa_actual'),
    // Última actividad extendida a 90 días para no mostrar "nunca" erróneo
    admin.from('habito_registros').select('usuario_id, fecha').gte('fecha', hace90),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const usuarios = usuariosRes.data ?? []
  const totalUsuarios = usuarios.length

  const activosHoy = new Set((activosHoyRes.data ?? []).map(r => r.usuario_id)).size
  const activos7 = new Set((activos7Res.data ?? []).map(r => r.usuario_id)).size
  const activos30 = new Set((activos30Res.data ?? []).map(r => r.usuario_id)).size
  const pushSubs = (pushSubsRes.data ?? []).length

  const authUsers = authUsersRes.data?.users ?? []
  const hace7Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const hace30Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const nuevos7 = authUsers.filter(u => new Date(u.created_at) > hace7Date).length
  const nuevos30 = authUsers.filter(u => new Date(u.created_at) > hace30Date).length

  // Top hábitos por cantidad de usuarios que lo tienen activo
  const habitoCount: Record<string, { emoji: string; count: number }> = {}
  for (const h of (habitosRes.data ?? [])) {
    if (!habitoCount[h.nombre]) habitoCount[h.nombre] = { emoji: h.emoji, count: 0 }
    habitoCount[h.nombre].count++
  }
  const topHabitos = Object.entries(habitoCount)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)

  // Education
  const completadosEdu = (educacionRes.data ?? []).filter(e => e.etapa_actual >= 11).length
  const pctEdu = totalUsuarios > 0 ? Math.round((completadosEdu / totalUsuarios) * 100) : 0
  const retencion7 = totalUsuarios > 0 ? Math.round((activos7 / totalUsuarios) * 100) : 0

  // Última actividad real por usuario (90 días de ventana)
  const ultimaActMap: Record<string, string> = {}
  for (const r of (ultimaActRes.data ?? [])) {
    if (!ultimaActMap[r.usuario_id] || r.fecha > ultimaActMap[r.usuario_id]) {
      ultimaActMap[r.usuario_id] = r.fecha
    }
  }

  // Usuarios dormidos: activos alguna vez pero sin actividad en 30+ días
  const dormidos = usuarios.filter(u => {
    const ultima = ultimaActMap[u.id]
    return ultima && ultima < hace30
  }).length

  // Tabla usuarios ordenada: activos primero, luego por última actividad
  const usuariosTabla = usuarios
    .map(u => ({
      ...u,
      ultimaActividad: ultimaActMap[u.id] ?? null,
      authUser: authUsers.find(a => a.id === u.id),
    }))
    .sort((a, b) => {
      if (!a.ultimaActividad && !b.ultimaActividad) return 0
      if (!a.ultimaActividad) return 1
      if (!b.ultimaActividad) return -1
      return b.ultimaActividad.localeCompare(a.ultimaActividad)
    })

  const retencionColor = retencion7 >= 40 ? '#10b981' : retencion7 >= 20 ? '#f59e0b' : '#ef4444'

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
            <p style={{ color: '#4b5563', fontSize: '0.78rem', marginTop: '0.25rem' }}>{today}</p>
          </div>
          <Link href="/tablero" style={{ fontSize: '0.78rem', color: '#6b7280', textDecoration: 'none', padding: '0.4rem 0.75rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '0.25rem' }}>
            ← App
          </Link>
        </div>

        {/* Stats principales — 3 columnas en desktop, 2 en mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <StatCard label="Total usuarios" value={fmt(totalUsuarios)} color="#a78bfa" sub="registrados" />
          <StatCard label="Activos hoy" value={fmt(activosHoy)} color="#10b981" sub="registraron hábitos" />
          <StatCard label="Activos 7 días" value={fmt(activos7)} color="#34d399" sub={`${retencion7}% retención`} />
          <StatCard label="Nuevos 7 días" value={fmt(nuevos7)} color="#60a5fa" sub={`${fmt(nuevos30)} en 30 días`} />
          <StatCard label="Push subs" value={fmt(pushSubs)} color="#f59e0b" sub="notificaciones activas" />
        </div>

        {/* Alerta dormidos */}
        {dormidos > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1rem' }}>⚠️</span>
            <div>
              <span style={{ color: '#fca5a5', fontSize: '0.82rem', fontWeight: 600 }}>{dormidos} usuario{dormidos > 1 ? 's' : ''} sin actividad en más de 30 días</span>
              <span style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: '0.5rem' }}>— candidatos para campaña de reactivación</span>
            </div>
          </div>
        )}

        {/* Top hábitos + Engagement */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

          <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem' }}>
            <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Hábitos más usados</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {topHabitos.length === 0 && (
                <p style={{ color: '#4b5563', fontSize: '0.78rem', margin: 0 }}>Sin datos aún</p>
              )}
              {topHabitos.map(([nombre, { emoji, count }]) => (
                <div key={nombre} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', width: '1.5rem', flexShrink: 0 }}>{emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.77rem', color: '#d1d5db' }}>{nombre}</span>
                      <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{count} {count === 1 ? 'usuario' : 'usuarios'}</span>
                    </div>
                    <div style={{ height: '3px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{
                        height: '100%', borderRadius: '99px', background: '#7c3aed',
                        width: `${Math.round((count / (topHabitos[0]?.[1]?.count ?? 1)) * 100)}%`,
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem', flex: 1 }}>
              <div style={{ fontSize: '0.62rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Retención 7 días</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: retencionColor, lineHeight: 1 }}>
                {totalUsuarios > 0 ? `${retencion7}%` : '—'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '0.3rem' }}>{activos7} activos / {totalUsuarios} total</div>
              <div style={{ height: '3px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', marginTop: '0.75rem' }}>
                <div style={{ height: '100%', borderRadius: '99px', background: retencionColor, width: `${Math.min(100, retencion7)}%`, transition: 'width 0.3s' }} />
              </div>
            </div>

            <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem', flex: 1 }}>
              <div style={{ fontSize: '0.62rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Activos 30 días</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#a78bfa', lineHeight: 1 }}>
                {totalUsuarios > 0 ? `${Math.round((activos30 / totalUsuarios) * 100)}%` : '—'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '0.3rem' }}>{activos30} de {totalUsuarios} usuarios</div>
            </div>

            <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem', flex: 1 }}>
              <div style={{ fontSize: '0.62rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Educación completada</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F5C518', lineHeight: 1 }}>{pctEdu}%</div>
              <div style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '0.3rem' }}>{completadosEdu} de {totalUsuarios} usuarios</div>
            </div>
          </div>
        </div>

        {/* Tabla usuarios */}
        <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem', overflowX: 'auto' }}>
          <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
            Usuarios <span style={{ color: '#6b7280', fontWeight: 400 }}>({totalUsuarios})</span>
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr>
                {['Nombre', 'Email', 'Registrado', 'Último hábito'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', color: '#6b7280', fontWeight: 600,
                    padding: '0.35rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuariosTabla.map(u => {
                const activo7d = u.ultimaActividad && u.ultimaActividad >= hace7
                const activo30d = u.ultimaActividad && u.ultimaActividad >= hace30
                const registrado = u.authUser?.created_at
                  ? new Date(u.authUser.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })
                  : '—'

                let actividadColor = '#374151'
                let actividadLabel = u.ultimaActividad ?? 'nunca'
                if (activo7d) { actividadColor = '#10b981'; actividadLabel += ' ✓' }
                else if (activo30d) { actividadColor = '#9ca3af' }
                else if (u.ultimaActividad) { actividadColor = '#6b7280' }

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#e5e7eb', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {u.nombre || <span style={{ color: '#374151' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#9ca3af' }}>{u.email}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{registrado}</td>
                    <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                      <span style={{ color: actividadColor, fontWeight: activo7d ? 600 : 400 }}>
                        {actividadLabel}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {usuariosTabla.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#4b5563', fontSize: '0.8rem' }}>
                    Sin usuarios registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
