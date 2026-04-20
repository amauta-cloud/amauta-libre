'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLocale, LOCALES, type Locale } from '@/lib/i18n/LocaleContext'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const supabase = createClient()
  const { t, locale, setLocale } = useLocale()

  const currentLocale = LOCALES.find(l => l.code === locale)

  async function handleGoogle() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  function handleLang(code: Locale) {
    setLocale(code)
    setLangOpen(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0d1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Language selector top-right */}
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 50 }}>
        <button
          onClick={() => setLangOpen(o => !o)}
          style={{
            padding: '0.4rem 0.75rem', borderRadius: '8px',
            background: 'rgba(26,23,48,0.9)', border: '1px solid rgba(139,92,246,0.2)',
            color: '#9ca3af', fontSize: '0.8rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}
        >
          <span>{currentLocale?.flag}</span>
          <span>{currentLocale?.label}</span>
          <span style={{ fontSize: '0.6rem' }}>▾</span>
        </button>
        {langOpen && (
          <div style={{
            position: 'absolute', top: '110%', right: 0,
            background: '#1a1730', border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '10px', overflow: 'hidden', zIndex: 100,
            width: '150px', maxHeight: '260px', overflowY: 'auto',
          }}>
            {LOCALES.map(l => (
              <button key={l.code} onClick={() => handleLang(l.code)} style={{
                width: '100%', padding: '0.5rem 0.75rem',
                background: l.code === locale ? 'rgba(139,92,246,0.15)' : 'transparent',
                border: 'none', color: l.code === locale ? '#a78bfa' : '#9ca3af',
                fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <span>{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{
        background: '#1a1730',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: '380px',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 1.5rem',
          background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.6rem', fontWeight: 800, color: 'white',
          boxShadow: '0 8px 32px rgba(139,92,246,0.3)',
        }}>
          A
        </div>

        <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.4rem' }}>
          Amauta Libre
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          {t('login.subtitle')}
        </p>
        <p style={{ color: '#6b7280', fontSize: '0.78rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          {t('login.tagline')}
        </p>

        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            padding: '0.9rem 1.25rem', borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: loading ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
            color: '#fff', fontSize: '0.95rem', fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.15s',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? t('login.button_loading') : t('login.button')}
        </button>

        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(139,92,246,0.06)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.12)' }}>
          <p style={{ color: '#7c3aed', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>{t('login.features_title')}</p>
          <p style={{ color: '#6b7280', fontSize: '0.72rem', lineHeight: 1.7 }}>
            {t('login.feature_1')}<br/>
            {t('login.feature_2')}<br/>
            {t('login.feature_3')}
          </p>
        </div>

        <p style={{ color: '#4b5563', fontSize: '0.7rem', marginTop: '1.5rem' }}>
          {t('login.privacy')}{' '}
          <a href="/privacidad" style={{ color: '#7c3aed', textDecoration: 'none' }}>{t('login.privacy_link')}</a>.
        </p>
      </div>
    </div>
  )
}
