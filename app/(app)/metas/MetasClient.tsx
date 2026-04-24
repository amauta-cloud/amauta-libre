'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/LocaleContext'

export default function MetasClient({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLocale()

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
    setToast(t('metas.guardado_toast'))
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
      <div style={{ color: '#a78bfa', fontSize: '0.9rem' }}>{t('metas.loading')}</div>
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
            {t('metas.titulo')}
          </h1>

          <div style={{
            background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '14px', padding: '1.75rem', marginBottom: '2rem', textAlign: 'left',
          }}>
            <p style={{ margin: '0 0 1rem', color: '#d1d5db', fontSize: '0.97rem', lineHeight: 1.7 }}>
              {t('metas.intro_p1')}
            </p>
            <p style={{ margin: '0 0 1rem', color: '#d1d5db', fontSize: '0.97rem', lineHeight: 1.7 }}>
              {t('metas.intro_p2')}{' '}
              <strong style={{ color: '#F5C518' }}>{t('metas.intro_p2_bold')}</strong>{' '}
              {t('metas.intro_p2_end')}
            </p>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.88rem', lineHeight: 1.6, fontStyle: 'italic' }}>
              {t('metas.intro_quote')}
            </p>
          </div>

          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            {t('metas.intro_sub')}
          </p>

          <button
            onClick={() => setStep(1)}
            style={{
              width: '100%', padding: '1rem', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              color: 'white', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            {t('metas.intro_btn')}
          </button>
          <Link href="/tablero" style={{
            display: 'block', textAlign: 'center', marginTop: '1rem',
            color: '#6b7280', fontSize: '0.8rem', textDecoration: 'none',
          }}>
            {t('metas.back_tablero')}
          </Link>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{t('metas.mapa_titulo')}</h2>
            <p style={{ margin: '0.5rem 0 0', color: '#9ca3af', fontSize: '0.875rem' }}>
              {t('metas.mapa_sub')}
            </p>
          </div>
          <Link href="/tablero" style={{
            padding: '0.45rem 0.875rem', borderRadius: '8px',
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
            color: '#a78bfa', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none',
            whiteSpace: 'nowrap', marginTop: '0.25rem',
          }}>{t('metas.back_tablero')}</Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Meta 30 */}
          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🌱</div>
              <div>
                <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>{t('metas.meta30_titulo')}</div>
                <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{t('metas.meta30_sub')}</div>
              </div>
            </div>
            <textarea
              value={meta30}
              onChange={e => setMeta30(e.target.value)}
              rows={3}
              placeholder={t('metas.meta30_placeholder')}
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
                <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.9rem' }}>{t('metas.meta90_titulo')}</div>
                <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{t('metas.meta90_sub')}</div>
              </div>
            </div>
            <textarea
              value={meta90}
              onChange={e => setMeta90(e.target.value)}
              rows={3}
              placeholder={t('metas.meta90_placeholder')}
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
                <div style={{ color: '#F5C518', fontWeight: 700, fontSize: '0.9rem' }}>{t('metas.meta180_titulo')}</div>
                <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{t('metas.meta180_sub')}</div>
              </div>
            </div>
            <textarea
              value={meta180}
              onChange={e => setMeta180(e.target.value)}
              rows={3}
              placeholder={t('metas.meta180_placeholder')}
              style={{ ...inputStyle, borderColor: meta180 ? 'rgba(245,197,24,0.4)' : 'rgba(255,255,255,0.08)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(245,197,24,0.5)' }}
              onBlur={e => { e.target.style.borderColor = meta180 ? 'rgba(245,197,24,0.4)' : 'rgba(255,255,255,0.08)' }}
            />
          </div>

          {/* Frase */}
          <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem', fontStyle: 'italic', lineHeight: 1.6 }}>
              {t('metas.quote_final')}
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
            {saving ? t('common.saving') : t('metas.guardar')}
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
