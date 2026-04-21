'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useLocale } from '@/lib/i18n/LocaleContext'

interface Etapa {
  id: string
  titulo: string
  tipo: string
  descripcion: string | null
  contenido: string | null
  duracion_min: number | null
  orden: number
}

const TIPO_EMOJI: Record<string, string> = {
  'Audio diario': '🎵',
  'Audiolibro': '🎙️',
  'Video': '🎬',
  'Libro PDF': '📄',
  'Biblioteca': '📚',
}

const TIPO_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  'Audio diario': { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)', text: '#a78bfa' },
  'Audiolibro':   { bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.25)', text: '#f472b6' },
  'Video':        { bg: 'rgba(245,197,24,0.08)',  border: 'rgba(245,197,24,0.25)',  text: '#fbbf24' },
  'Libro PDF':    { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)', text: '#34d399' },
  'Biblioteca':   { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)', text: '#60a5fa' },
}

export default function EducacionClient({
  etapas,
  userId,
}: {
  etapas: Etapa[]
  userId: string
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { t } = useLocale()

  const [loading, setLoading] = useState(true)
  const [paso, setPaso] = useState(0)
  const [reflexionInicial, setReflexionInicial] = useState('')
  const [reflexiones, setReflexiones] = useState<Record<string, string>>({})
  const [reflexionActual, setReflexionActual] = useState('')
  const [showTransicion, setShowTransicion] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    supabase
      .from('educacion_estado')
      .select('*')
      .eq('usuario_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPaso(data.etapa_actual ?? 0)
          setReflexionInicial(data.reflexion_inicial ?? '')
          setReflexiones(data.reflexiones_json ?? {})
        }
        setLoading(false)
      })
  }, [userId])

  const totalPasos = 11
  const etapasPorOrden: Record<number, Etapa> = {}
  for (const e of etapas) etapasPorOrden[e.orden] = e

  async function guardarEstado(patch: {
    etapa_actual?: number
    reflexion_inicial?: string
    reflexiones_json?: Record<string, string>
  }) {
    await supabase.from('educacion_estado').upsert({
      usuario_id: userId,
      etapa_actual: patch.etapa_actual ?? paso,
      reflexion_inicial: patch.reflexion_inicial ?? reflexionInicial,
      reflexiones_json: patch.reflexiones_json ?? reflexiones,
      actualizado_en: new Date().toISOString(),
    }, { onConflict: 'usuario_id' })
  }

  async function completarPaso0() {
    if (!reflexionInicial.trim()) return
    setSaving(true)
    await guardarEstado({ etapa_actual: 1, reflexion_inicial: reflexionInicial.trim() })
    setSaving(false)
    setPaso(1)
  }

  async function avanzarPaso() {
    const siguientePaso = paso + 1
    const nuevasReflexiones = { ...reflexiones, [String(paso)]: reflexionActual.trim() }
    setSaving(true)
    await guardarEstado({ etapa_actual: siguientePaso, reflexiones_json: nuevasReflexiones })
    setSaving(false)
    setReflexiones(nuevasReflexiones)
    setPaso(siguientePaso)
    setReflexionActual('')
    setShowTransicion(false)
    setToast(t('educacion.paso_listo', { n: siguientePaso }))
    setTimeout(() => setToast(''), 3000)
  }

  const etapaActual = etapasPorOrden[paso]
  const proximaEtapa = etapasPorOrden[paso + 1]
  const pasoIdx = paso - 1
  const hasTeaserProximo = paso >= 1 && paso < totalPasos

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#a78bfa', fontSize: '0.9rem' }}>{t('common.loading')}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0d1a', padding: '1.5rem 1rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{t('educacion.titulo')}</h1>
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#6b7280' }}>
            {paso === 0 ? t('educacion.hola', { name: '' }).trim().replace(/,\s*$/, '') : t('educacion.paso_progreso', { paso, total: totalPasos, name: '' }).trim()}
          </p>
        </div>

        {/* ── PASO 0 ── */}
        {paso === 0 && (
          <div style={cardStyle}>
            <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '1rem' }}>🌱</div>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 700, color: '#e5e7eb', textAlign: 'center' }}>
              {t('educacion.paso0_titulo')}
            </h2>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#9ca3af', lineHeight: 1.6, textAlign: 'center' }}>
              {t('educacion.paso0_sub')}
            </p>
            <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <p style={{ margin: '0 0 0.875rem', fontSize: '0.88rem', fontWeight: 600, color: '#c4b5fd', lineHeight: 1.5 }}>
                {t('educacion.paso0_pregunta')}
              </p>
              <textarea
                value={reflexionInicial}
                onChange={e => setReflexionInicial(e.target.value)}
                placeholder={t('educacion.paso0_placeholder')}
                rows={5}
                style={textareaStyle}
              />
            </div>
            <button
              onClick={completarPaso0}
              disabled={saving || !reflexionInicial.trim()}
              style={btnPrimary(saving || !reflexionInicial.trim())}
            >
              {saving ? t('educacion.paso0_saving') : t('educacion.paso0_btn')}
            </button>
          </div>
        )}

        {/* ── PASOS 1-11 ── */}
        {paso >= 1 && (
          <>
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ height: '6px', borderRadius: '99px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div style={{
                  height: '100%', borderRadius: '99px',
                  width: `${Math.round((paso / totalPasos) * 100)}%`,
                  background: paso >= totalPasos ? '#10b981' : 'linear-gradient(90deg, #8B5CF6, #EC4899)',
                  transition: 'width 0.5s',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#6b7280' }}>
                <span>{paso >= totalPasos ? t('educacion.completado') : t('educacion.del_camino', { pct: Math.round((paso / totalPasos) * 100) })}</span>
                <span>{t('educacion.pasos_counter', { paso, total: totalPasos })}</span>
              </div>
            </div>

            {reflexionInicial && (
              <details style={{ marginBottom: '1rem' }}>
                <summary style={{ fontSize: '0.75rem', color: '#6b7280', cursor: 'pointer', userSelect: 'none', marginBottom: '0.5rem' }}>
                  {t('educacion.reflexion_inicial')}
                </summary>
                <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '10px', padding: '0.875rem 1rem', marginTop: '0.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#c4b5fd', lineHeight: 1.6, fontStyle: 'italic' }}>"{reflexionInicial}"</p>
                </div>
              </details>
            )}

            {etapaActual && (
              <ContentCard
                etapa={etapaActual}
                mensajeIntro={paso >= 1 ? t(`educacion.pasos.${pasoIdx}.mensajeIntro`) : ''}
                paso={paso}
                t={t}
              />
            )}

            {paso < totalPasos && etapaActual && (
              <div style={{ ...cardStyle, background: 'rgba(245,197,24,0.04)', border: '1px solid rgba(245,197,24,0.15)' }}>
                {!showTransicion ? (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#9ca3af', lineHeight: 1.5 }}>
                      {etapaActual.tipo === 'Libro PDF'
                        ? t('educacion.pregunta_libro')
                        : etapaActual.tipo === 'Video'
                          ? t('educacion.pregunta_video')
                          : t('educacion.pregunta_audio')}
                    </p>
                    <button
                      onClick={() => setShowTransicion(true)}
                      style={{
                        padding: '0.65rem 1.5rem', borderRadius: '10px',
                        background: 'rgba(245,197,24,0.12)', border: '1px solid rgba(245,197,24,0.3)',
                        color: '#F5C518', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                      }}
                    >
                      {etapaActual.tipo === 'Libro PDF'
                        ? t('educacion.listo_libro')
                        : etapaActual.tipo === 'Video'
                          ? t('educacion.listo_video')
                          : t('educacion.listo_audio')} →
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.68rem', color: '#F5C518', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                        {etapaActual.titulo.split('—')[0].trim()}
                      </div>
                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', color: '#e5e7eb', fontWeight: 600, lineHeight: 1.5 }}>
                        {t(`educacion.pasos.${pasoIdx}.preguntaTransicion`)}
                      </p>
                      <textarea
                        value={reflexionActual}
                        onChange={e => setReflexionActual(e.target.value)}
                        placeholder={t('educacion.reflexion_placeholder')}
                        rows={4}
                        style={textareaStyle}
                      />
                    </div>

                    {hasTeaserProximo && proximaEtapa && (
                      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                          {t('educacion.lo_que_viene')}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e5e7eb', marginBottom: '0.4rem' }}>
                          {TIPO_EMOJI[proximaEtapa.tipo] || '📄'} {t(`educacion.pasos.${pasoIdx}.teaserProximo`)}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af', lineHeight: 1.5 }}>
                          {t(`educacion.pasos.${pasoIdx}.mensajeProximo`)}
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.625rem' }}>
                      <button
                        onClick={() => { setShowTransicion(false); setReflexionActual('') }}
                        style={{
                          padding: '0.65rem 1rem', borderRadius: '10px',
                          background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                          color: '#6b7280', fontSize: '0.82rem', cursor: 'pointer',
                        }}
                      >
                        {t('educacion.volver')}
                      </button>
                      <button
                        onClick={avanzarPaso}
                        disabled={saving || !reflexionActual.trim()}
                        style={{ ...btnPrimary(saving || !reflexionActual.trim()), flex: 1 }}
                      >
                        {saving ? t('educacion.paso0_saving') : t('educacion.arrancar_con', { titulo: t(`educacion.pasos.${pasoIdx}.teaserProximo`) })}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {paso >= totalPasos && (
              <div style={{ ...cardStyle, textAlign: 'center', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏆</div>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#6ee7b7' }}>
                  {t('educacion.llegaste')}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#9ca3af', lineHeight: 1.6 }}>
                  {t('educacion.once_materiales')}
                </p>
              </div>
            )}

            {paso > 1 && (
              <details style={{ marginTop: '1.5rem' }}>
                <summary style={{ fontSize: '0.78rem', color: '#6b7280', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
                  {t('educacion.lo_que_recorriste', { n: paso - 1 })}
                </summary>
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {Array.from({ length: paso - 1 }, (_, i) => i + 1).reverse().map(p => {
                    const e = etapasPorOrden[p]
                    const reflexionPaso = reflexiones[String(p)]
                    if (!e) return null
                    const col = TIPO_COLOR[e.tipo] || TIPO_COLOR['Libro PDF']
                    return (
                      <div key={p} style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: '10px', padding: '0.875rem 1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: reflexionPaso ? '0.5rem' : 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e5e7eb' }}>
                            {TIPO_EMOJI[e.tipo] || '📄'} {e.titulo.split('—')[0].trim()}
                          </div>
                          {e.contenido && e.contenido !== '#' && (
                            <a href={e.contenido} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: col.text, textDecoration: 'none', fontWeight: 600 }}>
                              Abrir →
                            </a>
                          )}
                        </div>
                        {reflexionPaso && (
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.5, fontStyle: 'italic' }}>
                            "{reflexionPaso.length > 120 ? reflexionPaso.substring(0, 120) + '...' : reflexionPaso}"
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </details>
            )}
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '2.5rem', color: '#4b5563', fontSize: '0.72rem' }}>
          Amauta Libre
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: 'white', padding: '0.6rem 1.25rem', borderRadius: '99px', fontSize: '0.82rem', fontWeight: 700, zIndex: 999, boxShadow: '0 4px 20px rgba(16,185,129,0.4)', whiteSpace: 'nowrap' }}>
          ✓ {toast}
        </div>
      )}
    </div>
  )
}

function ContentCard({ etapa, mensajeIntro, paso, t }: {
  etapa: Etapa
  mensajeIntro: string
  paso: number
  t: (key: string, vars?: Record<string, string | number>) => string
}) {
  const col = TIPO_COLOR[etapa.tipo] || TIPO_COLOR['Libro PDF']
  const emoji = TIPO_EMOJI[etapa.tipo] || '📄'

  const ctaKey = etapa.tipo === 'Audio diario'
    ? 'educacion.cta_audio'
    : etapa.tipo === 'Audiolibro'
      ? 'educacion.cta_audiolibro'
      : etapa.tipo === 'Video'
        ? 'educacion.cta_video'
        : etapa.tipo === 'Biblioteca'
          ? 'educacion.cta_biblioteca'
          : 'educacion.cta_libro'

  const cta = t(ctaKey)

  return (
    <div style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: '14px', padding: '1.5rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', marginBottom: '0.875rem' }}>
        <div style={{ fontSize: '2rem', flexShrink: 0 }}>{emoji}</div>
        <div>
          <div style={{ fontSize: '0.65rem', color: col.text, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
            Paso {paso} · {etapa.tipo}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e5e7eb', lineHeight: 1.3 }}>{etapa.titulo}</div>
        </div>
      </div>

      {etapa.descripcion && (
        <p style={{ margin: '0 0 0.875rem', fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.6 }}>
          {etapa.descripcion}
        </p>
      )}

      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.75rem 0.875rem', marginBottom: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.83rem', color: '#d1d5db', lineHeight: 1.6 }}>{mensajeIntro}</p>
      </div>

      {etapa.contenido && etapa.contenido !== '#' ? (
        <a
          href={etapa.contenido}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block', padding: '0.6rem 1.25rem', borderRadius: '8px',
            background: col.bg, border: `1px solid ${col.border}`,
            color: col.text, fontWeight: 700, fontSize: '0.83rem', textDecoration: 'none',
          }}
        >
          {cta} →
        </a>
      ) : (
        <div style={{ fontSize: '0.78rem', color: '#4b5563', fontStyle: 'italic' }}>
          El material llega pronto.
        </div>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#1a1730',
  border: '1px solid rgba(139,92,246,0.15)',
  borderRadius: '14px',
  padding: '1.5rem',
  marginBottom: '1rem',
}

const textareaStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)',
  borderRadius: '8px', color: '#e5e7eb', fontSize: '0.84rem',
  padding: '0.75rem', resize: 'vertical', outline: 'none', lineHeight: 1.6,
}

function btnPrimary(disabled: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '0.75rem', borderRadius: '10px',
    background: disabled ? 'rgba(139,92,246,0.2)' : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
    color: disabled ? '#6b7280' : '#fff', fontWeight: 700, fontSize: '0.88rem',
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
  }
}
