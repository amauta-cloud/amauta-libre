'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Metas {
  meta30: string
  meta90: string
  meta180: string
}

export default function MetasClient({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0) // 0=intro, 1=form
  const [meta30, setMeta30] = useState('')
  const [meta90, setMeta90] = useState('')
  const [meta180, setMeta180] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    supabase
      .from('metas')
      .select('meta30,meta90,meta180')
      .eq('usuario_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setMeta30(data.meta30 || '')
          setMeta90(data.meta90 || '')
          setMeta180(data.meta180 || '')
          setStep(1)
        }
        setLoading(false)
      })
  }, [userId])

  async function guardar() {
    if (!meta30.trim() && !meta90.trim() && !meta180.trim()) return
    setSaving(true)
    await supabase.from('metas').upsert({
      usuario_id: userId,
      meta30: meta30.trim(),
      meta90: meta90.trim(),
      meta180: meta180.trim(),
      actualizado_en: new Date().toISOString(),
    }, { onConflict: 'usuario_id' })
    setSaving(false)
    setToast('Metas guardadas. Vamos.')
    setTimeout(() => {
      setToast('')
      router.push('/tablero')
    }, 1500)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '0.875rem 1rem', borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#f3f0ff', fontSize: '0.92rem', outline: 'none',
    resize: 'none', fontFamily: 'inherit', lineHeight: 1.5,
    transition: 'border-color 0.2s',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0d1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#a78bfa', fontSize: '0.9rem' }}>Un momento...</div>
    </div>
  )

  if (step === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #0b0520 60%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.25rem',
      }}>
        <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.75rem', fontSize: '1.8rem',
          }}>
            ⚓
          </div>

          <h1 style={{
            fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 800,
            color: '#fff', margin: '0 0 1.25rem', lineHeight: 1.2,
          }}>
            ¿Sabés adónde vas?
          </h1>

          <div style={{
            background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '14px', padding: '1.75rem', marginBottom: '2rem', textAlign: 'left',
          }}>
            <p style={{ margin: '0 0 1rem', color: '#d1d5db', fontSize: '0.97rem', lineHeight: 1.7 }}>
              Un barco sin destino no navega — deriva. Puede tener el mejor motor, la mejor tripulación, los mejores vientos. Si no sabe adónde ir, el océano lo lleva a donde quiera.
            </p>
            <p style={{ margin: '0 0 1rem', color: '#d1d5db', fontSize: '0.97rem', lineHeight: 1.7 }}>
              El éxito no es un accidente. Es la{' '}
              <strong style={{ color: '#F5C518' }}>realización progresiva de un ideal que elegiste con claridad</strong>{' '}
              — un destino que trazaste antes de zarpar.
            </p>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.88rem', lineHeight: 1.6, fontStyle: 'italic' }}>
              "El éxito es la realización progresiva de un ideal digno." — Earl Nightingale
            </p>
          </div>

          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            Dos minutos para definir adónde vas. Este es el mapa de tu travesía.
          </p>

          <button
            onClick={() => setStep(1)}
            style={{
              width: '100%', padding: '1rem', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              color: 'white', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Definir mis metas →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #0b0520 60%)',
      padding: '2rem 1.25rem',
    }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Tu mapa de destinos</h2>
            <p style={{ margin: '0.5rem 0 0', color: '#9ca3af', fontSize: '0.875rem' }}>
              Escribí con libertad. No hay respuestas correctas.
            </p>
          </div>
          <Link href="/tablero" style={{
            padding: '0.45rem 0.875rem', borderRadius: '8px',
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
            color: '#a78bfa', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none',
            whiteSpace: 'nowrap', marginTop: '0.25rem',
          }}>← Tablero</Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Meta 30 */}
          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🌱</div>
              <div>
                <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>Meta de 30 días</div>
                <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>¿Qué querés lograr este mes?</div>
              </div>
            </div>
            <textarea
              value={meta30}
              onChange={e => setMeta30(e.target.value)}
              rows={3}
              placeholder="Ej: Conseguir 3 clientes nuevos, lanzar mi primer servicio, completar el curso..."
              style={{ ...inputStyle, borderColor: meta30 ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(16,185,129,0.5)' }}
              onBlur={e => { e.target.style.borderColor = meta30 ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Meta 90 */}
          <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🚀</div>
              <div>
                <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.9rem' }}>Meta de 90 días</div>
                <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>¿Dónde te ves en 3 meses?</div>
              </div>
            </div>
            <textarea
              value={meta90}
              onChange={e => setMeta90(e.target.value)}
              rows={3}
              placeholder="Ej: Sistema de ventas armado, equipo de 2 personas, ingresos recurrentes..."
              style={{ ...inputStyle, borderColor: meta90 ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.5)' }}
              onBlur={e => { e.target.style.borderColor = meta90 ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Meta 180 */}
          <div style={{ background: 'rgba(245,197,24,0.06)', border: '1px solid rgba(245,197,24,0.2)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245,197,24,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🏆</div>
              <div>
                <div style={{ color: '#F5C518', fontWeight: 700, fontSize: '0.9rem' }}>Meta de 180 días</div>
                <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>¿Quién sos dentro de 6 meses?</div>
              </div>
            </div>
            <textarea
              value={meta180}
              onChange={e => setMeta180(e.target.value)}
              rows={3}
              placeholder="Ej: Referente en mi nicho, vivir de mis ingresos digitales, 2 semanas de vacaciones..."
              style={{ ...inputStyle, borderColor: meta180 ? 'rgba(245,197,24,0.4)' : 'rgba(255,255,255,0.08)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(245,197,24,0.5)' }}
              onBlur={e => { e.target.style.borderColor = meta180 ? 'rgba(245,197,24,0.4)' : 'rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Frase */}
          <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem', fontStyle: 'italic', lineHeight: 1.6 }}>
              "El momento de plantar un árbol fue hace 20 años. El segundo mejor momento es ahora."
            </p>
          </div>

          {/* Botón */}
          <button
            onClick={guardar}
            disabled={saving || (!meta30.trim() && !meta90.trim() && !meta180.trim())}
            style={{
              width: '100%', padding: '1rem', borderRadius: '12px', border: 'none',
              background: saving || (!meta30.trim() && !meta90.trim() && !meta180.trim())
                ? 'rgba(139,92,246,0.3)'
                : 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              color: 'white', fontSize: '1rem', fontWeight: 700,
              cursor: saving || (!meta30.trim() && !meta90.trim() && !meta180.trim()) ? 'default' : 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar mis metas →'}
          </button>
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
