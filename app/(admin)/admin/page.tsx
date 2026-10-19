import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import Link from 'next/link'
import AdminPushButton from '@/components/AdminPushButton'
import AdminUsuariosTable from '@/components/AdminUsuariosTable'
import { Tablero, Fila, Bloque, Kpi, GraficoDias, Embudo, Alertas, Ranking, cambioPct, type Alerta } from '@/components/Tablero'

export const dynamic = 'force-dynamic'

const ADMIN_EMAIL = 'amauta.iiaa@gmail.com'

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmt(n: number) {
  return n.toLocaleString('es-AR')
}

// 18/10/2026: Supabase devuelve como máximo 1.000 filas por consulta (los registros de 90 días ya eran 978 y
// finanzas 926): se piden de a 1.000 hasta traer todo, si no los activos y «usan finanzas» se cuentan de menos.
async function todas<T>(armar: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null }>): Promise<{ data: T[] }> {
  const out: T[] = []
  for (let i = 0; ; i += 1000) {
    const { data } = await armar(i, i + 999)
    out.push(...(data ?? []))
    if (!data || data.length < 1000) return { data: out }
  }
}
// Activo = completó al menos un hábito ese día (la misma regla que las rachas)
const completo = (r: { valor_bool: boolean | null; valor_numero: number | null }) => r.valor_bool === true || (r.valor_numero !== null && r.valor_numero > 0)

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
  // Todas las fechas en hora de Argentina (antes el gráfico iba en UTC y «hoy» en Argentina: de noche se corría)
  const diaArg = (n: number) => dateStr(new Date(nowArg.getTime() - n * 24 * 60 * 60 * 1000))
  const hace7 = diaArg(6)     // los últimos 7 días, hoy incluido
  const hace14 = diaArg(13)
  const hace30 = diaArg(29)
  const hace90 = diaArg(89)

  const [
    usuariosRes,
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
    admin.from('push_subscriptions').select('usuario_id').then(r => r.error ? { data: [] as { usuario_id: string }[] } : r),
    todas<{ id: string; nombre: string; emoji: string; categoria: string | null; usuario_id: string }>((a, b) => admin.from('habitos').select('id, nombre, emoji, categoria, usuario_id').eq('activo', true).order('id').range(a, b)),
    admin.from('educacion_estado').select('usuario_id, etapa_actual'),
    todas<{ usuario_id: string; habito_id: string; fecha: string; valor_bool: boolean | null; valor_numero: number | null }>((a, b) => admin.from('habito_registros').select('usuario_id, habito_id, fecha, valor_bool, valor_numero').gte('fecha', hace90).order('fecha').order('usuario_id').range(a, b)),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from('habito_registros').select('usuario_id, habito_id, valor_bool, valor_numero').eq('fecha', today).limit(500),
    admin.from('soporte_mensajes').select('id, usuario_id, mensaje, categoria, creado_en').order('creado_en', { ascending: false }).limit(50).then(r => r.error ? { data: [] as { id: string; usuario_id: string; mensaje: string; categoria: string; creado_en: string }[] } : r),
    todas<{ usuario_id: string }>((a, b) => admin.from('finanzas_items').select('usuario_id').order('usuario_id').range(a, b)),
    todas<{ usuario_id: string }>((a, b) => admin.from('metas').select('usuario_id').order('usuario_id').range(a, b)),
  ])

  const usuarios = usuariosRes.data ?? []
  const totalUsuarios = usuarios.length
  const soporteMensajes = soporteRes.data ?? []
  const emailMap = Object.fromEntries(usuarios.map(u => [u.id, u.email || u.nombre || '?']))
  const emailOnlyMap = Object.fromEntries(usuarios.map(u => [u.id, u.email ?? '']))
  const usuariosConFinanzas = new Set((finanzasRes.data ?? []).map(r => r.usuario_id)).size
  const pctFinanzas = totalUsuarios > 0 ? Math.round((usuariosConFinanzas / totalUsuarios) * 100) : 0

  const regsOk = (registros90Res.data ?? []).filter(completo)
  const hoyPorUsuarioIds = new Set(regsOk.filter(r => r.fecha === today).map(r => r.usuario_id))
  const activosEntre = (desde: string, hasta = today) => new Set(regsOk.filter(r => r.fecha >= desde && r.fecha <= hasta).map(r => r.usuario_id))
  const setActivos30 = activosEntre(hace30)
  const activosHoy = activosEntre(today).size
  const activos7 = activosEntre(hace7).size
  const activos7Ant = activosEntre(hace14, diaArg(7)).size
  const activos30 = setActivos30.size
  const pushSubs = (pushSubsRes.data ?? []).length

  const authUsers = authUsersRes.data?.users ?? []
  const authUserMap = new Map(authUsers.map(u => [u.id, u.created_at]))
  const hace7Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const hace14Date = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const hace30Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const nuevos7 = authUsers.filter(u => new Date(u.created_at) > hace7Date).length
  const nuevos7Ant = authUsers.filter(u => {
    const d = new Date(u.created_at)
    return d > hace14Date && d <= hace7Date
  }).length
  const nuevos30 = authUsers.filter(u => new Date(u.created_at) > hace30Date).length

  // 18/10/2026: «más usados» contaba los hábitos ASIGNADOS (los de ejemplo los tienen casi todos). Ahora: los que más se cumplen
  const nombrePorHabito = new Map((habitosRes.data ?? []).map(h => [h.id, `${h.emoji} ${h.nombre}`]))
  const cumplidos: Record<string, { veces: number; gente: Set<string> }> = {}
  for (const r of regsOk) {
    if (r.fecha < hace30) continue
    const n = nombrePorHabito.get(r.habito_id) ?? 'Hábito borrado'
    cumplidos[n] ??= { veces: 0, gente: new Set() }
    cumplidos[n].veces++; cumplidos[n].gente.add(r.usuario_id)
  }
  const masCumplidos = Object.entries(cumplidos).sort((a, b) => b[1].veces - a[1].veces).slice(0, 8)
  const activosHoyLista = usuarios.filter(u => hoyPorUsuarioIds.has(u.id))
  // Aprendizaje (educación)
  const completadosEdu = (educacionRes.data ?? []).filter(e => e.etapa_actual >= 16).length
  const retencion7 = totalUsuarios > 0 ? Math.round((activos7 / totalUsuarios) * 100) : 0

  // Embudo de conversión
  // Embudo en cadena (18/10/2026): cada paso es parte del anterior; antes mezclaba grupos sueltos y el «-%» no tenía sentido
  const setHabitos = new Set((habitosRes.data ?? []).map(h => h.usuario_id))
  const setMetas = new Set((metasRes.data ?? []).map(r => r.usuario_id))
  const setEdu = new Set((educacionRes.data ?? []).filter(e => e.etapa_actual >= 16).map(e => e.usuario_id))
  // «Crearon hábitos» daba 100 %: la app le crea hábitos de ejemplo a todos al registrarse. Lo que cuenta es completarlos.
  const setCompletaron = new Set(regsOk.map(r => r.usuario_id))
  const paso2 = usuarios.filter(u => setCompletaron.has(u.id))
  const paso3 = paso2.filter(u => setActivos30.has(u.id))
  const paso4 = paso3.filter(u => setMetas.has(u.id))
  const paso5 = paso4.filter(u => setEdu.has(u.id))
  const embudo: [string, number][] = [['Se registraron', totalUsuarios], ['Completaron un hábito (90 días)', paso2.length], ['Activos en 30 días', paso3.length], ['Con metas', paso4.length], ['Aprendizaje completo', paso5.length]]
  // Donde más se pierde = donde más GENTE se va (de 94 a 3 pesa más que de 2 a 0)
  const corteEmbudo = embudo.slice(1).reduce((peor, [, v], i) => { const se = embudo[i][1] - v; return se > peor.se ? { i: i + 1, se } : peor }, { i: -1, se: 0 }).i

  // DAU chart: últimos 30 días
  const registros90 = registros90Res.data ?? []
  const dauPorFecha: Record<string, Set<string>> = {}
  for (const r of regsOk) {
    if (r.fecha >= hace30) {
      if (!dauPorFecha[r.fecha]) dauPorFecha[r.fecha] = new Set()
      dauPorFecha[r.fecha].add(r.usuario_id)
    }
  }
  const dauArray: { fecha: string; label: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const fecha = diaArg(i)
    const label = `${fecha.slice(8, 10)}/${Number(fecha.slice(5, 7))}`
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
    const alta = authUserMap.get(u.id)
    return alta && new Date(alta) < hace30Date && !setActivos30.has(u.id)
  }).length

  const soporte7 = soporteMensajes.filter(m => m.creado_en >= `${hace7}T03:00:00`).length
  const alertas: Alerta[] = []
  if (dormidos) alertas.push({ nivel: 'ojo', titulo: `${dormidos} usuario${dormidos > 1 ? 's' : ''} sin completar nada en 30 días`, texto: 'Registrados hace más de un mes: candidatos para una campaña de reactivación.' })
  if (retencion7 < 20) alertas.push({ nivel: 'mal', titulo: `Solo el ${retencion7} % estuvo activo esta semana`, texto: 'Menos de 1 de cada 5 usuarios completó un hábito en 7 días.' })
  else if (retencion7 >= 40) alertas.push({ nivel: 'bien', titulo: `${retencion7} % activos esta semana`, texto: 'Más de 4 de cada 10 completaron un hábito.' })
  else alertas.push({ nivel: 'ojo', titulo: `${retencion7} % activos esta semana`, texto: 'Entre 2 y 4 de cada 10 completaron un hábito.' })
  if (soporte7) alertas.push({ nivel: 'ojo', titulo: `${soporte7} mensaje${soporte7 > 1 ? 's' : ''} de soporte esta semana`, texto: 'Están al final del panel.' })

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
      authUser: authUserMap.has(u.id) ? { created_at: authUserMap.get(u.id)! } : null,
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

        {/* Tablero (18/10/2026, mismo motor que los paneles de AMAUTA, con los colores de Libre) */}
        <Tablero>
          <Fila>
            <Kpi dato="Usuarios" valor={fmt(totalUsuarios)} nota={`${fmt(nuevos30)} nuevos en 30 días · ${pushSubs} con avisos`} />
            <Kpi dato="Activos 7 días" valor={fmt(activos7)} cambio={cambioPct(activos7, activos7Ant)} nota={`${retencion7} % de los usuarios · hoy ${activosHoy}`} serie={dauArray.map(d => d.count)} color="var(--tb-ok)" />
            <Kpi dato="Nuevos 7 días" valor={fmt(nuevos7)} cambio={cambioPct(nuevos7, nuevos7Ant)} nota={`los 7 anteriores: ${nuevos7Ant}`} color="var(--tb-dorado)" />
            <Kpi dato="Usan finanzas" valor={`${pctFinanzas} %`} nota={`${usuariosConFinanzas} de ${totalUsuarios} usuarios`} color="var(--tb-rosa)" />
          </Fila>
          <Fila columnas={2}>
            <Bloque titulo="Usuarios activos por día" nota="completaron al menos un hábito · 30 días">
              <GraficoDias etiquetas={dauArray.map(d => d.label.split('/')[0])} barras={dauArray.map(d => d.count)} nombreBarra="Usuarios activos" />
              <p className="tb-nota" style={{ marginTop: '.4rem' }}>Pico: {maxDau} · promedio: {Math.round(dauArray.reduce((a, d) => a + d.count, 0) / dauArray.length)} por día.</p>
            </Bloque>
            <Bloque titulo="Alertas" nota="para mirar">
              <Alertas items={alertas} vacio="Todo en orden." />
            </Bloque>
          </Fila>
          <Fila columnas={2}>
            <Bloque titulo="Embudo" nota="cada paso es parte del anterior">
              <Embudo pasos={embudo} corte={corteEmbudo} nota={corteEmbudo > 0 ? `↳ Donde más gente se pierde: ${fmt(embudo[corteEmbudo - 1][1] - embudo[corteEmbudo][1])} entre «${embudo[corteEmbudo - 1][0]}» y «${embudo[corteEmbudo][0]}».` : undefined} />
            </Bloque>
            <Bloque titulo="Qué parte usan" nota="usuarios">
              <Ranking items={[['Completaron un hábito (90 días)', setCompletaron.size], ['Finanzas', usuariosConFinanzas], ['Metas', setMetas.size], ['Avisos al celular', pushSubs], ['Aprendizaje completo', completadosEdu]]} />
              <p className="tb-nota" style={{ marginTop: '.6rem' }}>Cuántos usaron cada parte alguna vez, de {totalUsuarios} registrados.</p>
            </Bloque>
          </Fila>
        </Tablero>

        {/* Hoy, rachas y lo que se cumple (18/10/2026: antes era una nube de 94 nombres, categorías con 93 % «General»
            y tres tarjetas que repetían el tablero de arriba) */}
        <Tablero>
          <Fila columnas={3}>
            <Bloque titulo="Hoy" nota={`${activosHoyLista.length} de ${totalUsuarios} completaron algo`}>
              {activosHoyLista.length
                ? <Ranking items={activosHoyLista.map(u => [u.nombre || u.email || '?', (hoyPorUsuario[u.id] ?? []).length] as [string, number])} />
                : <div className="tb-vacio">Nadie completó un hábito hoy todavía.</div>}
              <p className="tb-nota" style={{ marginTop: '.6rem' }}>Hábitos cumplidos hoy por cada uno.</p>
            </Bloque>
            <Bloque titulo="Rachas activas" nota="días seguidos">
              {rachasData.length ? <Ranking items={rachasData.map(u => [u.nombre || u.email || '?', u.streak] as [string, number])} /> : <div className="tb-vacio">Sin rachas activas.</div>}
            </Bloque>
            <Bloque titulo="Lo que más se cumple" nota="veces · 30 días">
              {masCumplidos.length ? <Ranking items={masCumplidos.map(([n, v]) => [`${n} · ${v.gente.size} persona${v.gente.size > 1 ? 's' : ''}`, v.veces] as [string, number])} /> : <div className="tb-vacio">Nadie completó hábitos en 30 días.</div>}
            </Bloque>
          </Fila>
        </Tablero>

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
