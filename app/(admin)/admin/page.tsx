import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import Link from 'next/link'

const ADMIN_EMAIL = 'amauta.iiaa@gmail.com'

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmt(n: number) {
  return n.toLocaleString('es-AR')
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

  const [
    usuariosRes,
    activosRes,
    pushSubsRes,
    habitosRes,
    educacionRes,
    registros30Res,
    authUsersRes,
  ] = await Promise.all([
    admin.from('usuarios').select('id, nombre, email'),
    admin.from('habito_registros').select('usuario_id').gte('fecha', hace7),
    admin.from('push_subscriptions').select('usuario_id, created_at').then(r => r.error ? { data: [] } : r),
    admin.from('habitos').select('nombre, emoji').eq('activo', true),
    admin.from('educacion_estado').select('usuario_id, etapa_actual'),
    admin.from('habito_registros').select('usuario_id, fecha').gte('fecha', hace30),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const usuarios = usuariosRes.data ?? []
  const totalUsuarios = usuarios.length

  const activosIds = new Set((activosRes.data ?? []).map(r => r.usuario_id))
  const activosUltimos7 = activosIds.size

  const authUsers = authUsersRes.data?.users ?? []
  const hace7Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const hace30Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const nuevos7 = authUsers.filter(u => new Date(u.created_at) > hace7Date).length
  const nuevos30 = authUsers.filter(u => new Date(u.created_at) > hace30Date).length

  const pushSubs = pushSubsRes.data?.length ?? 0

  // Top hábitos
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
  const retencion7 = totalUsuarios > 0 ? Math.round((activosUltimos7 / totalUsuarios) * 100) : 0

  // Last activity per user
  const ultimaActividadMap: Record<string, string> = {}
  for (const r of (registros30Res.data ?? [])) {
    if (!ultimaActividadMap[r.usuario_id] || r.fecha > ultimaActividadMap[r.usuario_id]) {
      ultimaActividadMap[r.usuario_id] = r.fecha
    }
  }

  const usuariosTabla = [...usuarios]
    .map(u => ({
      ...u,
      ultimaActividad: ultimaActividadMap[u.id] ?? null,
      authUser: authUsers.find(a => a.id === u.id),
    }))
    .sort((a, b) => {
      if (!a.ultimaActividad && !b.ultimaActividad) return 0
      if (!a.ultimaActividad) return 1
      if (!b.ultimaActividad) return -1
      return b.ultimaActividad.localeCompare(a.ultimaActividad)
    })

  const statCards = [
    { label: 'Total usuarios', value: fmt(totalUsuarios), color: '#a78bfa', sub: 'registrados' },
    { label: 'Activos 7 días', value: fmt(activosUltimos7), color: '#10b981', sub: 'registraron hábitos' },
    { label: 'Nuevos 7 días', value: fmt(nuevos7), color: '#60a5fa', sub: `${fmt(nuevos30)} en 30 días` },
    { label: 'Push subs', value: fmt(pushSubs), color: '#f59e0b', sub: 'notificaciones activas' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f0d1a', padding: '2rem 1rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <p style={{ color: '#7c3aed', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
              Amauta Libre — Admin
            </p>
            <h1 style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Panel de control</h1>
            <p style={{ color: '#4b5563', fontSize: '0.78rem', marginTop: '0.25rem' }}>{today}</p>
          </div>
          <Link href="/tablero" style={{ fontSize: '0.78rem', color: '#6b7280', textDecoration: 'none', padding: '0.4rem 0.75rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
            ← App
          </Link>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {statCards.map(s => (
            <div key={s.label} style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '14px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.62rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{s.label}</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '0.3rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Top hábitos + Engagement */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>

          <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem' }}>
            <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Hábitos más usados</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {topHabitos.length === 0 && (
                <p style={{ color: '#4b5563', fontSize: '0.78rem', margin: 0 }}>Sin datos</p>
              )}
              {topHabitos.map(([nombre, { emoji, count }]) => (
                <div key={nombre} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', width: '1.5rem', flexShrink: 0 }}>{emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.77rem', color: '#d1d5db' }}>{nombre}</span>
                      <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{count} usuarios</span>
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
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: retencion7 >= 40 ? '#10b981' : retencion7 >= 20 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>
                {totalUsuarios > 0 ? `${retencion7}%` : '—'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '0.3rem' }}>{activosUltimos7} activos / {totalUsuarios} total</div>
            </div>
            <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem', flex: 1 }}>
              <div style={{ fontSize: '0.62rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Educación completada</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#F5C518', lineHeight: 1 }}>{pctEdu}%</div>
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
                const activo = u.ultimaActividad && u.ultimaActividad >= hace7
                const registrado = u.authUser?.created_at
                  ? new Date(u.authUser.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })
                  : '—'
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#e5e7eb', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {u.nombre || <span style={{ color: '#374151' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#9ca3af' }}>{u.email}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{registrado}</td>
                    <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                      <span style={{
                        color: activo ? '#10b981' : u.ultimaActividad ? '#6b7280' : '#374151',
                        fontWeight: activo ? 600 : 400,
                        fontSize: activo ? '0.78rem' : '0.75rem',
                      }}>
                        {u.ultimaActividad ?? 'nunca'}
                        {activo && ' ✓'}
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
