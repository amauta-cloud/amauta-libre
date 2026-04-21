'use client'

import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useLocale } from '@/lib/i18n/LocaleContext'

type Tab = 'ideas' | 'tareas' | 'calendario'

interface Idea {
  id: string
  texto: string
  realizado: boolean
  creado_en: string
}

interface Tarea {
  id: string
  texto: string
  estado: 'pendiente' | 'en_progreso' | 'completada'
  fecha_limite: string | null
  creado_en: string
}

interface Evento {
  id: string
  titulo: string
  fecha: string
  hora: string | null
  notas: string
  realizado: boolean
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '0.65rem 0.875rem', borderRadius: '8px',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)',
  color: '#f3f0ff', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
}

const BTN_BASE: React.CSSProperties = {
  border: 'none', borderRadius: '8px', cursor: 'pointer',
  fontSize: '0.82rem', fontWeight: 600, padding: '0.55rem 1rem', transition: 'all 0.15s',
}

function formatFecha(f: string) {
  if (!f) return ''
  const [y, m, d] = f.split('-')
  return `${d}/${m}/${y}`
}

function diasRestantes(fecha: string, today: string, t: (key: string, vars?: Record<string, string | number>) => string) {
  const diff = Math.round((new Date(fecha + 'T12:00:00').getTime() - new Date(today + 'T12:00:00').getTime()) / 86400000)
  if (diff < 0) return t('planificacion.tarea_vencida_n', { n: Math.abs(diff) })
  if (diff === 0) return t('planificacion.tarea_hoy')
  if (diff === 1) return t('planificacion.tarea_manana')
  return t('planificacion.tarea_en_n', { n: diff })
}

export default function PlanificacionClient({ userId, today, nombre }: { userId: string; today: string; nombre: string }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { t } = useLocale()

  const [tab, setTab] = useState<Tab>('ideas')

  // ── IDEAS ──
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [ideasLoading, setIdeasLoading] = useState(true)
  const [ideaTexto, setIdeaTexto] = useState('')
  const [ideaAdding, setIdeaAdding] = useState(false)
  const [ideaShowForm, setIdeaShowForm] = useState(false)
  const [ideaEditing, setIdeaEditing] = useState<Idea | null>(null)
  const [ideaEditTexto, setIdeaEditTexto] = useState('')

  // ── TAREAS ──
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [tareasLoading, setTareasLoading] = useState(true)
  const [tareaTexto, setTareaTexto] = useState('')
  const [tareaFecha, setTareaFecha] = useState('')
  const [tareaAdding, setTareaAdding] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  // ── CALENDARIO ──
  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventosLoading, setEventosLoading] = useState(true)
  const [evShowForm, setEvShowForm] = useState(false)
  const [evAdding, setEvAdding] = useState(false)
  const [evTitulo, setEvTitulo] = useState('')
  const [evFecha, setEvFecha] = useState('')
  const [evHora, setEvHora] = useState('')
  const [evNotas, setEvNotas] = useState('')
  const [evEditing, setEvEditing] = useState<Evento | null>(null)
  const [evEditTitulo, setEvEditTitulo] = useState('')
  const [evEditFecha, setEvEditFecha] = useState('')
  const [evEditHora, setEvEditHora] = useState('')
  const [evEditNotas, setEvEditNotas] = useState('')

  // ── LOADERS ──
  const loadIdeas = useCallback(async () => {
    setIdeasLoading(true)
    const { data } = await supabase.from('ideas').select('*').eq('usuario_id', userId).order('creado_en', { ascending: false })
    setIdeas(data || [])
    setIdeasLoading(false)
  }, [userId])

  const loadTareas = useCallback(async () => {
    setTareasLoading(true)
    const { data } = await supabase.from('tareas').select('*').eq('usuario_id', userId).order('creado_en')
    setTareas(data || [])
    setTareasLoading(false)
  }, [userId])

  const loadEventos = useCallback(async () => {
    setEventosLoading(true)
    const { data } = await supabase.from('eventos').select('*').eq('usuario_id', userId).order('fecha').order('hora')
    setEventos(data || [])
    setEventosLoading(false)
  }, [userId])

  useEffect(() => { loadIdeas() }, [loadIdeas])
  useEffect(() => { loadTareas() }, [loadTareas])
  useEffect(() => { loadEventos() }, [loadEventos])

  // ── IDEAS ACTIONS ──
  async function addIdea() {
    if (!ideaTexto.trim()) return
    setIdeaAdding(true)
    await supabase.from('ideas').insert({ usuario_id: userId, texto: ideaTexto.trim() })
    setIdeaTexto(''); setIdeaShowForm(false); setIdeaAdding(false)
    loadIdeas()
  }

  async function toggleIdea(idea: Idea) {
    await supabase.from('ideas').update({ realizado: !idea.realizado }).eq('id', idea.id)
    loadIdeas()
  }

  async function saveEditIdea() {
    if (!ideaEditing || !ideaEditTexto.trim()) return
    await supabase.from('ideas').update({ texto: ideaEditTexto.trim() }).eq('id', ideaEditing.id)
    setIdeaEditing(null); loadIdeas()
  }

  async function deleteIdea(id: string) {
    if (!confirm(t('planificacion.ideas_eliminar'))) return
    await supabase.from('ideas').delete().eq('id', id)
    loadIdeas()
  }

  // ── TAREAS ACTIONS ──
  async function addTarea() {
    if (!tareaTexto.trim()) return
    setTareaAdding(true)
    await supabase.from('tareas').insert({ usuario_id: userId, texto: tareaTexto.trim(), estado: 'pendiente', fecha_limite: tareaFecha || null })
    setTareaTexto(''); setTareaFecha(''); setTareaAdding(false)
    loadTareas()
  }

  async function toggleTarea(t: Tarea) {
    const next = t.estado === 'completada' ? 'pendiente' : 'completada'
    await supabase.from('tareas').update({ estado: next }).eq('id', t.id)
    loadTareas()
  }

  async function deleteTarea(id: string) {
    await supabase.from('tareas').delete().eq('id', id)
    loadTareas()
  }

  // ── EVENTOS ACTIONS ──
  async function addEvento() {
    if (!evTitulo.trim() || !evFecha) return
    setEvAdding(true)
    await supabase.from('eventos').insert({ usuario_id: userId, titulo: evTitulo.trim(), fecha: evFecha, hora: evHora || null, notas: evNotas.trim() })
    setEvTitulo(''); setEvFecha(''); setEvHora(''); setEvNotas(''); setEvShowForm(false); setEvAdding(false)
    loadEventos()
  }

  async function saveEditEvento() {
    if (!evEditing || !evEditTitulo.trim() || !evEditFecha) return
    await supabase.from('eventos').update({ titulo: evEditTitulo.trim(), fecha: evEditFecha, hora: evEditHora || null, notas: evEditNotas.trim() }).eq('id', evEditing.id)
    setEvEditing(null); loadEventos()
  }

  async function toggleEvento(ev: Evento) {
    await supabase.from('eventos').update({ realizado: !ev.realizado }).eq('id', ev.id)
    loadEventos()
  }

  async function deleteEvento(id: string) {
    if (!confirm(t('planificacion.evento_eliminar'))) return
    await supabase.from('eventos').delete().eq('id', id)
    loadEventos()
  }

  // ── TAREAS groups ──
  const vencidas = tareas.filter(t => t.fecha_limite && t.fecha_limite < today && t.estado !== 'completada')
  const hoy = tareas.filter(t => t.fecha_limite === today && t.estado !== 'completada')
  const proximas = tareas.filter(t => (!t.fecha_limite || t.fecha_limite > today) && t.estado !== 'completada')
  const completadas = tareas.filter(t => t.estado === 'completada')

  const navTab = (tabKey: Tab, emoji: string, label: string) => (
    <button onClick={() => setTab(tabKey)} style={{
      flex: 1, padding: '0.5rem 0.25rem', borderRadius: '8px', border: 'none',
      background: tab === tabKey ? 'rgba(139,92,246,0.25)' : 'transparent',
      color: tab === tabKey ? '#a78bfa' : '#6b7280',
      fontWeight: tab === tabKey ? 700 : 400,
      fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s',
    }}>{emoji} {label}</button>
  )

  const AddBtn = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} style={{ ...BTN_BASE, background: 'rgba(139,92,246,0.08)', color: '#a78bfa', border: '1px dashed rgba(139,92,246,0.35)', width: '100%', padding: '0.75rem' }}>
      {t('common.add')}
    </button>
  )

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: '#7c3aed', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
          {t('planificacion.espacio')}
        </p>
        <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          {nombre ? t('planificacion.titulo', { nombre }) : t('planificacion.titulo_default')}
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0.35rem 0 0' }}>
          {t('planificacion.subtitulo')}
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.2rem', padding: '0.25rem', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', marginBottom: '1.5rem' }}>
        {navTab('ideas', '💡', t('planificacion.tab_ideas'))}
        {navTab('tareas', '✅', t('planificacion.tab_tareas'))}
        {navTab('calendario', '📅', t('planificacion.tab_calendario'))}
      </div>

      {/* ══ IDEAS ══ */}
      {tab === 'ideas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {ideaShowForm ? (
            <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '12px', padding: '1rem' }}>
              <textarea
                value={ideaTexto}
                onChange={e => setIdeaTexto(e.target.value)}
                placeholder={t('planificacion.ideas_placeholder')}
                autoFocus
                rows={3}
                style={{ ...INPUT_STYLE, resize: 'vertical', marginBottom: '0.75rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={addIdea} disabled={!ideaTexto.trim() || ideaAdding}
                  style={{ ...BTN_BASE, flex: 1, background: ideaTexto.trim() ? '#8b5cf6' : 'rgba(139,92,246,0.3)', color: 'white' }}>
                  {ideaAdding ? t('planificacion.guardando') : t('planificacion.ideas_guardar')}
                </button>
                <button onClick={() => { setIdeaShowForm(false); setIdeaTexto('') }}
                  style={{ ...BTN_BASE, background: 'transparent', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', padding: '0.55rem 0.75rem' }}>✕</button>
              </div>
            </div>
          ) : (
            <AddBtn onClick={() => { setIdeaShowForm(true); setIdeaEditing(null) }} />
          )}

          {ideasLoading && <div style={{ textAlign: 'center', color: '#4b5563', padding: '2rem', fontSize: '0.82rem' }}>{t('planificacion.cargando')}</div>}

          {!ideasLoading && ideas.length === 0 && !ideaShowForm && (
            <div style={{ textAlign: 'center', color: '#4b5563', padding: '2.5rem 1rem', fontSize: '0.85rem' }}>
              {t('planificacion.ideas_empty')}<br />
              <span style={{ fontSize: '0.75rem' }}>{t('planificacion.ideas_empty_sub')}</span>
            </div>
          )}

          {ideas.map(idea => (
            <div key={idea.id}>
              {ideaEditing?.id === idea.id ? (
                <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', padding: '1rem' }}>
                  <textarea value={ideaEditTexto} onChange={e => setIdeaEditTexto(e.target.value)} rows={3} autoFocus
                    style={{ ...INPUT_STYLE, resize: 'vertical', marginBottom: '0.75rem' }} />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={saveEditIdea} disabled={!ideaEditTexto.trim()}
                      style={{ ...BTN_BASE, flex: 1, background: '#8b5cf6', color: 'white' }}>{t('planificacion.guardar')}</button>
                    <button onClick={() => setIdeaEditing(null)}
                      style={{ ...BTN_BASE, background: 'transparent', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', padding: '0.55rem 0.75rem' }}>✕</button>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: idea.realizado ? 'rgba(16,185,129,0.05)' : '#1a1730',
                  border: `1px solid ${idea.realizado ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.1)'}`,
                  borderRadius: '12px', padding: '0.875rem 1rem',
                  display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                }}>
                  <button onClick={() => toggleIdea(idea)} style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                    border: idea.realizado ? 'none' : '2px solid rgba(139,92,246,0.4)',
                    background: idea.realizado ? '#10b981' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    {idea.realizado && <span style={{ fontSize: '0.65rem', color: 'white' }}>✓</span>}
                  </button>
                  <p style={{ flex: 1, margin: 0, fontSize: '0.875rem', color: idea.realizado ? '#6b7280' : '#e5e7eb', textDecoration: idea.realizado ? 'line-through' : 'none', lineHeight: 1.5, wordBreak: 'break-word' }}>
                    {idea.texto}
                  </p>
                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                    <button onClick={() => { setIdeaEditing(idea); setIdeaEditTexto(idea.texto); setIdeaShowForm(false) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.8rem', padding: '2px 4px' }}>✏️</button>
                    <button onClick={() => deleteIdea(idea.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.6)', fontSize: '0.8rem', padding: '2px 4px' }}>🗑️</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══ TAREAS ══ */}
      {tab === 'tareas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '14px', padding: '1rem' }}>
            <input
              value={tareaTexto}
              onChange={e => setTareaTexto(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTarea()}
              placeholder={t('planificacion.tarea_placeholder')}
              style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.9rem', outline: 'none', marginBottom: '0.75rem' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input type="date" value={tareaFecha} min={today} onChange={e => setTareaFecha(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', padding: '0.35rem 0.6rem', color: '#9ca3af', fontSize: '0.78rem', outline: 'none', colorScheme: 'dark' }} />
              <button onClick={addTarea} disabled={!tareaTexto.trim() || tareaAdding}
                style={{ marginLeft: 'auto', padding: '0.45rem 1.1rem', borderRadius: '8px', background: tareaTexto.trim() ? '#8B5CF6' : 'rgba(139,92,246,0.2)', border: 'none', color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: tareaTexto.trim() ? 'pointer' : 'default' }}>
                {tareaAdding ? t('planificacion.guardando') : t('planificacion.tarea_agregar')}
              </button>
            </div>
          </div>

          {tareasLoading && <div style={{ textAlign: 'center', color: '#4b5563', padding: '2rem', fontSize: '0.82rem' }}>{t('planificacion.cargando')}</div>}

          {!tareasLoading && (
            <>
              {vencidas.length > 0 && <TareaSection label={t('planificacion.tarea_vencidas')} color="#ef4444" items={vencidas} today={today} onToggle={toggleTarea} onDelete={deleteTarea} t={t} />}
              {hoy.length > 0 && <TareaSection label={t('planificacion.tarea_hoy')} color="#f59e0b" items={hoy} today={today} onToggle={toggleTarea} onDelete={deleteTarea} t={t} />}
              {proximas.length > 0 && <TareaSection label={t('planificacion.tarea_proximas')} color="#9ca3af" items={proximas} today={today} onToggle={toggleTarea} onDelete={deleteTarea} t={t} />}

              {completadas.length > 0 && (
                <div>
                  <button onClick={() => setShowCompleted(v => !v)}
                    style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    {showCompleted ? '▾' : '▸'} {t('planificacion.tarea_completadas')} ({completadas.length})
                  </button>
                  {showCompleted && <TareaSection label={t('planificacion.tarea_completadas')} color="#10b981" items={completadas} today={today} onToggle={toggleTarea} onDelete={deleteTarea} t={t} />}
                </div>
              )}

              {vencidas.length === 0 && hoy.length === 0 && proximas.length === 0 && completadas.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#6b7280' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
                  <p>{t('planificacion.tarea_empty')}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══ CALENDARIO ══ */}
      {tab === 'calendario' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {evShowForm ? (
            <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: '12px', padding: '1rem' }}>
              <input value={evTitulo} onChange={e => setEvTitulo(e.target.value)} placeholder={t('planificacion.evento_titulo_placeholder')} autoFocus
                style={{ ...INPUT_STYLE, marginBottom: '0.625rem' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '0.625rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>{t('planificacion.evento_fecha')}</label>
                  <input type="date" value={evFecha} onChange={e => setEvFecha(e.target.value)}
                    style={{ ...INPUT_STYLE, colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>{t('planificacion.evento_hora')}</label>
                  <input type="time" value={evHora} onChange={e => setEvHora(e.target.value)}
                    style={{ ...INPUT_STYLE, colorScheme: 'dark' }} />
                </div>
              </div>
              <textarea value={evNotas} onChange={e => setEvNotas(e.target.value)} placeholder={t('planificacion.evento_notas')} rows={2}
                style={{ ...INPUT_STYLE, resize: 'vertical', marginBottom: '0.75rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={addEvento} disabled={!evTitulo.trim() || !evFecha || evAdding}
                  style={{ ...BTN_BASE, flex: 1, background: (evTitulo.trim() && evFecha) ? '#8b5cf6' : 'rgba(139,92,246,0.3)', color: 'white' }}>
                  {evAdding ? t('planificacion.guardando') : t('planificacion.evento_guardar')}
                </button>
                <button onClick={() => { setEvShowForm(false); setEvTitulo(''); setEvFecha(''); setEvHora(''); setEvNotas('') }}
                  style={{ ...BTN_BASE, background: 'transparent', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', padding: '0.55rem 0.75rem' }}>✕</button>
              </div>
            </div>
          ) : (
            <AddBtn onClick={() => { setEvShowForm(true); setEvEditing(null) }} />
          )}

          {eventosLoading && <div style={{ textAlign: 'center', color: '#4b5563', padding: '2rem', fontSize: '0.82rem' }}>{t('planificacion.cargando')}</div>}

          {!eventosLoading && eventos.length === 0 && !evShowForm && (
            <div style={{ textAlign: 'center', color: '#4b5563', padding: '2.5rem 1rem', fontSize: '0.85rem' }}>
              {t('planificacion.evento_empty')}<br />
              <span style={{ fontSize: '0.75rem' }}>{t('planificacion.evento_empty_sub')}</span>
            </div>
          )}

          {eventos.map(ev => (
            <div key={ev.id}>
              {evEditing?.id === ev.id ? (
                <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', padding: '1rem' }}>
                  <input value={evEditTitulo} onChange={e => setEvEditTitulo(e.target.value)} placeholder={t('planificacion.evento_titulo_edit')} autoFocus
                    style={{ ...INPUT_STYLE, marginBottom: '0.625rem' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '0.625rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>{t('planificacion.evento_fecha_label')}</label>
                      <input type="date" value={evEditFecha} onChange={e => setEvEditFecha(e.target.value)}
                        style={{ ...INPUT_STYLE, colorScheme: 'dark' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginBottom: '0.3rem' }}>{t('planificacion.evento_hora_label')}</label>
                      <input type="time" value={evEditHora} onChange={e => setEvEditHora(e.target.value)}
                        style={{ ...INPUT_STYLE, colorScheme: 'dark' }} />
                    </div>
                  </div>
                  <textarea value={evEditNotas} onChange={e => setEvEditNotas(e.target.value)} placeholder={t('planificacion.evento_notas_edit')} rows={2}
                    style={{ ...INPUT_STYLE, resize: 'vertical', marginBottom: '0.75rem' }} />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={saveEditEvento} disabled={!evEditTitulo.trim() || !evEditFecha}
                      style={{ ...BTN_BASE, flex: 1, background: '#8b5cf6', color: 'white' }}>{t('planificacion.guardar')}</button>
                    <button onClick={() => setEvEditing(null)}
                      style={{ ...BTN_BASE, background: 'transparent', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', padding: '0.55rem 0.75rem' }}>✕</button>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: ev.realizado ? 'rgba(16,185,129,0.05)' : '#1a1730',
                  border: `1px solid ${ev.realizado ? 'rgba(16,185,129,0.2)' : ev.fecha < today ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.1)'}`,
                  borderRadius: '12px', padding: '0.875rem 1rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: ev.realizado ? '#6b7280' : '#e5e7eb', wordBreak: 'break-word' }}>
                        {ev.titulo}
                      </p>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                        {ev.fecha && <span style={{ fontSize: '0.72rem', color: '#a78bfa' }}>📅 {formatFecha(ev.fecha)}</span>}
                        {ev.hora && <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>⏰ {ev.hora}</span>}
                        {ev.realizado && <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>{t('planificacion.evento_realizado')}</span>}
                      </div>
                      {ev.notas && <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.5 }}>{ev.notas}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                      <button onClick={() => toggleEvento(ev)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: ev.realizado ? '#10b981' : '#6b7280', fontSize: '0.85rem', padding: '2px 4px' }}>
                        {ev.realizado ? '↩' : '✓'}
                      </button>
                      <button onClick={() => { setEvEditing(ev); setEvEditTitulo(ev.titulo); setEvEditFecha(ev.fecha); setEvEditHora(ev.hora || ''); setEvEditNotas(ev.notas); setEvShowForm(false) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.8rem', padding: '2px 4px' }}>✏️</button>
                      <button onClick={() => deleteEvento(ev.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.6)', fontSize: '0.8rem', padding: '2px 4px' }}>🗑️</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TareaSection({ label, color, items, today, onToggle, onDelete, t }: {
  label: string; color: string; items: Tarea[]; today: string
  onToggle: (t: Tarea) => void; onDelete: (id: string) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <p style={{ color, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{label}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map(tarea => {
          const done = tarea.estado === 'completada'
          const vencida = tarea.fecha_limite && tarea.fecha_limite < today && !done
          return (
            <div key={tarea.id} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
              padding: '0.875rem 1rem', borderRadius: '12px', background: '#1a1730',
              border: `1px solid ${vencida ? 'rgba(239,68,68,0.25)' : done ? 'rgba(16,185,129,0.15)' : 'rgba(139,92,246,0.1)'}`,
              opacity: done ? 0.6 : 1,
            }}>
              <button onClick={() => onToggle(tarea)} style={{
                marginTop: '2px', width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                background: done ? '#10b981' : 'transparent',
                border: `2px solid ${done ? '#10b981' : vencida ? '#ef4444' : 'rgba(139,92,246,0.4)'}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff',
              }}>{done ? '✓' : ''}</button>
              <div style={{ flex: 1 }}>
                <p style={{ color: done ? '#6b7280' : '#e5e7eb', fontSize: '0.875rem', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.4, margin: 0 }}>{tarea.texto}</p>
                {tarea.fecha_limite && (
                  <span style={{ marginTop: '0.3rem', display: 'inline-block', fontSize: '0.7rem', fontWeight: 600, color: vencida ? '#ef4444' : tarea.fecha_limite === today ? '#f59e0b' : '#6b7280' }}>
                    {diasRestantes(tarea.fecha_limite, today, t)}
                  </span>
                )}
              </div>
              <button onClick={() => onDelete(tarea.id)} style={{ background: 'transparent', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem', flexShrink: 0 }}>×</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
