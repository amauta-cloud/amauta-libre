'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useLocale, LOCALES, type Locale } from '@/lib/i18n/LocaleContext'

const purple = '#8B5CF6'
const gold = '#F5C518'
const green = '#10b981'
const bgApp = '#0f0d1a'
const bgCard = '#1a1730'
const textPrimary = '#f3f0ff'
const textMuted = '#9ca3af'
const gradientCTA = 'linear-gradient(135deg, #8B5CF6, #EC4899)'
const borderSubtle = 'rgba(255,255,255,0.07)'
const borderPurple = 'rgba(139,92,246,0.2)'

export default function LandingPage() {
  const { t, locale, setLocale } = useLocale()
  const [langOpen, setLangOpen] = useState(false)
  const currentLocale = LOCALES.find(l => l.code === locale) ?? LOCALES[0]

  function handleLang(code: Locale) {
    setLocale(code)
    setLangOpen(false)
  }

  const screenshots = [
    { src: '/screenshots/screenshot_1_habitos.png', label: t('landing.screenshot_1_label'), desc: t('landing.screenshot_1_desc') },
    { src: '/screenshots/screenshot_2_metas.png', label: t('landing.screenshot_2_label'), desc: t('landing.screenshot_2_desc') },
    { src: '/screenshots/screenshot_3_tablero.png', label: t('landing.screenshot_3_label'), desc: t('landing.screenshot_3_desc') },
    { src: '/screenshots/screenshot_4_finanzas.png', label: t('landing.screenshot_4_label'), desc: t('landing.screenshot_4_desc') },
  ]

  const problemas = [
    { icon: '🔄', title: t('landing.problema_1_title'), desc: t('landing.problema_1_desc') },
    { icon: '💸', title: t('landing.problema_2_title'), desc: t('landing.problema_2_desc') },
    { icon: '🎯', title: t('landing.problema_3_title'), desc: t('landing.problema_3_desc') },
  ]

  const modulos = [
    {
      emoji: '⚡',
      title: t('landing.mod_habitos_title'),
      color: purple,
      items: [t('landing.mod_habitos_1'), t('landing.mod_habitos_2'), t('landing.mod_habitos_3'), t('landing.mod_habitos_4')],
    },
    {
      emoji: '💰',
      title: t('landing.mod_finanzas_title'),
      color: gold,
      items: [t('landing.mod_finanzas_1'), t('landing.mod_finanzas_2'), t('landing.mod_finanzas_3'), t('landing.mod_finanzas_4')],
    },
    {
      emoji: '🎯',
      title: t('landing.mod_metas_title'),
      color: green,
      items: [t('landing.mod_metas_1'), t('landing.mod_metas_2'), t('landing.mod_metas_3'), t('landing.mod_metas_4')],
    },
  ]

  const metas = [
    { emoji: '🌱', label: t('landing.meta_30_label'), question: t('landing.meta_30_q'), color: green, bg: `${green}12` },
    { emoji: '🚀', label: t('landing.meta_90_label'), question: t('landing.meta_90_q'), color: purple, bg: `${purple}12` },
    { emoji: '🏆', label: t('landing.meta_180_label'), question: t('landing.meta_180_q'), color: gold, bg: `${gold}12` },
  ]

  const gratisItems = [
    { icon: '✅', text: t('landing.gratis_1') },
    { icon: '🚫', text: t('landing.gratis_2') },
    { icon: '💳', text: t('landing.gratis_3') },
    { icon: '♾️', text: t('landing.gratis_4') },
    { icon: '🔒', text: t('landing.gratis_5') },
    { icon: '🌍', text: t('landing.gratis_6') },
  ]

  const androidSteps = [
    t('landing.instalar_android_1'),
    t('landing.instalar_android_2'),
    t('landing.instalar_android_3'),
    t('landing.instalar_android_4'),
  ]

  const iosSteps = [
    t('landing.instalar_ios_1'),
    t('landing.instalar_ios_2'),
    t('landing.instalar_ios_3'),
    t('landing.instalar_ios_4'),
  ]

  return (
    <div style={{ background: bgApp, color: textPrimary, fontFamily: "'Inter', sans-serif", minHeight: '100vh' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .btn-cta {
          background: ${gradientCTA};
          color: white; border: none; border-radius: 12px;
          font-weight: 700; cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          display: inline-flex; align-items: center; gap: 10px; text-decoration: none;
        }
        .btn-cta:hover { opacity: 0.9; transform: translateY(-1px); }
        .card { background: ${bgCard}; border: 1px solid ${borderPurple}; border-radius: 16px; padding: 28px 24px; }
        .section { padding: 80px 24px; max-width: 960px; margin: 0 auto; }
        .section-full { padding: 80px 24px; }
        .tag {
          display: inline-block; background: rgba(139,92,246,0.12); color: #a78bfa;
          border: 1px solid rgba(139,92,246,0.3); border-radius: 999px;
          font-size: 0.78rem; font-weight: 600; padding: 4px 14px; margin-bottom: 20px;
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        @media (max-width: 640px) {
          .section { padding: 60px 20px; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .grid-4 { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .hero-title { font-size: clamp(2rem, 8vw, 3.4rem) !important; }
          .nav-inner { padding: 0 20px !important; }
          .screenshot-item { border-radius: 16px !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(15,13,26,0.85)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${borderSubtle}` }}>
        <div className="nav-inner" style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/logo-transparent.png" alt="Amauta Libre" width={32} height={32} style={{ borderRadius: 8 }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: textPrimary }}>Amauta Libre</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href="https://instagram.com/amauta.libre" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: textMuted, transition: 'color 0.2s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://tiktok.com/@amauta.libre" target="_blank" rel="noopener noreferrer" aria-label="TikTok" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: textMuted, transition: 'color 0.2s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.56V6.79a4.85 4.85 0 01-1.07-.1z"/></svg>
              </a>
            </div>

            {/* Language selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setLangOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                  background: langOpen ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.06)',
                  color: textMuted, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '1rem' }}>{currentLocale.flag}</span>
                <span style={{ fontSize: '0.75rem' }}>{currentLocale.code.toUpperCase()}</span>
                <span style={{ fontSize: '0.6rem', opacity: 0.6 }}>{langOpen ? '▲' : '▼'}</span>
              </button>
              {langOpen && (
                <>
                  {/* Backdrop to close */}
                  <div
                    onClick={() => setLangOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                  />
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
                    background: '#1a1730', border: '1px solid rgba(139,92,246,0.25)',
                    borderRadius: 12, padding: '6px', minWidth: 160,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}>
                    {LOCALES.map(l => (
                      <button
                        key={l.code}
                        onClick={() => handleLang(l.code)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '7px 10px', borderRadius: 8, border: 'none',
                          background: l.code === locale ? 'rgba(139,92,246,0.2)' : 'transparent',
                          color: l.code === locale ? '#a78bfa' : '#9ca3af',
                          fontWeight: l.code === locale ? 700 : 400,
                          fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left',
                          transition: 'all 0.1s', width: '100%',
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>{l.flag}</span>
                        <span>{l.label}</span>
                        {l.code === locale && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Link href="/login" className="btn-cta" style={{ padding: '8px 20px', fontSize: '0.875rem' }}>
              {t('landing.nav_entrar')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: '100px 24px 80px', maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(139,92,246,0.08)', border: `1px solid rgba(139,92,246,0.25)`, borderRadius: 999, padding: '5px 16px', fontSize: '0.78rem', fontWeight: 600, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 28 }}>
          {t('landing.hero_pill')}
        </div>

        <h1 className="hero-title" style={{ fontSize: 'clamp(2.4rem, 6vw, 3.8rem)', fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.02em', marginBottom: 20 }}>
          {t('landing.hero_h1_1')}<br />
          <span style={{ background: gradientCTA, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('landing.hero_h1_2')}</span>
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: textMuted, maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.6 }}>
          {t('landing.hero_sub')}
        </p>

        <Link href="/login" className="btn-cta" style={{ padding: '16px 36px', fontSize: '1.05rem', borderRadius: 14, boxShadow: '0 8px 32px rgba(139,92,246,0.3)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          {t('landing.hero_cta')}
        </Link>

        <p style={{ marginTop: 16, fontSize: '0.82rem', color: '#6b7280' }}>
          {t('landing.hero_note')}
        </p>

        {/* Ring mockup visual */}
        <div style={{ marginTop: 64, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: bgCard, border: `1px solid ${borderPurple}`, borderRadius: 24, padding: 32, maxWidth: 320, width: '100%', boxShadow: '0 24px 80px rgba(139,92,246,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>⚡ Hoy</span>
              <span style={{ color: '#F5C518', fontSize: '0.85rem', fontWeight: 600 }}>🔥 12 días</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ position: 'relative', width: 110, height: 110 }}>
                <svg width="110" height="110" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="46" fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="10" />
                  <circle cx="55" cy="55" r="46" fill="none" stroke="url(#grad)" strokeWidth="10" strokeLinecap="round" strokeDasharray="289" strokeDashoffset="72" transform="rotate(-90 55 55)" />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.4rem', background: gradientCTA, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>75%</span>
                  <span style={{ fontSize: '0.65rem', color: textMuted }}>hoy</span>
                </div>
              </div>
            </div>
            {[
              { emoji: '💧', name: 'Agua', done: true },
              { emoji: '📚', name: 'Lectura', done: true },
              { emoji: '🏃', name: 'Ejercicio', done: true },
              { emoji: '🧘', name: 'Meditación', done: false },
            ].map((h) => (
              <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${borderSubtle}` }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: h.done ? gradientCTA : 'rgba(255,255,255,0.06)', border: h.done ? 'none' : '1.5px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {h.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
                <span style={{ fontSize: '0.88rem', opacity: h.done ? 1 : 0.5 }}>{h.emoji} {h.name}</span>
              </div>
            ))}
            <p style={{ marginTop: 16, fontSize: '0.8rem', color: '#a78bfa', textAlign: 'center', fontWeight: 600 }}>Vas bien, seguí</p>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section style={{ padding: '28px 24px', borderBottom: `1px solid ${borderSubtle}`, background: 'rgba(139,92,246,0.04)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '32px 48px' }}>
          <div style={{ display: 'flex', gap: 40 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: purple, lineHeight: 1 }}>70</div>
              <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: 4 }}>{t('landing.proof_users_label')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: green, lineHeight: 1 }}>469</div>
              <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: 4 }}>{t('landing.proof_habits_label')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: gold, lineHeight: 1 }}>10</div>
              <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: 4 }}>{t('landing.proof_langs_label')}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: textMuted }}>{t('landing.proof_redes')}</span>
            <a href="https://instagram.com/amauta.libre" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${borderSubtle}`, color: textPrimary, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              @amauta.libre
            </a>
            <a href="https://tiktok.com/@amauta.libre" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${borderSubtle}`, color: textPrimary, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.56V6.79a4.85 4.85 0 01-1.07-.1z"/></svg>
              @amauta.libre
            </a>
            <a href="https://facebook.com/amauta.libre" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${borderSubtle}`, color: textPrimary, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Amauta Libre
            </a>
          </div>
        </div>
      </section>

      {/* ── CAPTURAS REALES ── */}
      <section style={{ padding: '80px 24px', background: 'radial-gradient(ellipse at center, #130b28 0%, #0b0520 70%)', borderTop: `1px solid ${borderSubtle}`, borderBottom: `1px solid ${borderSubtle}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <div className="tag">{t('landing.screenshots_tag')}</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 12 }}>
            {t('landing.screenshots_h2')}
          </h2>
          <p style={{ color: textMuted, marginBottom: 48, fontSize: '1rem' }}>
            {t('landing.screenshots_sub')}
          </p>
          <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, alignItems: 'start' }}>
            {screenshots.map((s) => (
              <div key={s.src} className="screenshot-item" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(139,92,246,0.22)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
                <Image
                  src={s.src}
                  alt={s.label}
                  width={300}
                  height={620}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
                <div style={{ padding: '10px 12px', background: bgCard, borderTop: `1px solid ${borderSubtle}`, textAlign: 'left' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: textPrimary }}>{s.label}</div>
                  <div style={{ fontSize: '0.7rem', color: textMuted }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEMA ── */}
      <section style={{ padding: '80px 24px', background: 'rgba(139,92,246,0.03)', borderTop: `1px solid ${borderSubtle}`, borderBottom: `1px solid ${borderSubtle}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 16 }}>
            {t('landing.problema_h2')}
          </h2>
          <p style={{ color: textMuted, marginBottom: 48, fontSize: '1rem' }}>
            {t('landing.problema_sub')}
          </p>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {problemas.map((p) => (
              <div key={p.title} className="card" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: 12 }}>{p.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 8, color: textPrimary }}>{p.title}</h3>
                <p style={{ color: textMuted, fontSize: '0.875rem', lineHeight: 1.6 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 MÓDULOS ── */}
      <section className="section">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="tag">{t('landing.modulos_tag')}</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800 }}>
            {t('landing.modulos_h2')}
          </h2>
          <p style={{ color: textMuted, marginTop: 12, fontSize: '1rem' }}>{t('landing.modulos_sub')}</p>
        </div>
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {modulos.map((mod) => (
            <div key={mod.title} className="card" style={{ borderColor: `${mod.color}33` }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${mod.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: 16 }}>
                {mod.emoji}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 16, color: mod.color }}>{mod.title}</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {mod.items.map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, fontSize: '0.875rem', color: textMuted }}>
                    <span style={{ color: mod.color, marginTop: 2, flexShrink: 0 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── METAS 30/90/180 ── */}
      <section style={{ padding: '80px 24px', background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #0b0520 60%)', borderTop: `1px solid ${borderSubtle}`, borderBottom: `1px solid ${borderSubtle}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="tag">{t('landing.metas_tag')}</div>
            <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 12 }}>
              {t('landing.metas_h2')}
            </h2>
            <p style={{ color: textMuted, fontSize: '1rem' }}>
              {t('landing.metas_sub')}
            </p>
          </div>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {metas.map((m) => (
              <div key={m.label} style={{ background: m.bg, border: `1px solid ${m.color}33`, borderRadius: 16, padding: '28px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.4rem', marginBottom: 12 }}>{m.emoji}</div>
                <div style={{ fontWeight: 800, color: m.color, fontSize: '1.1rem', marginBottom: 10 }}>{m.label}</div>
                <p style={{ color: textMuted, fontSize: '0.875rem', lineHeight: 1.5, fontStyle: 'italic' }}>{m.question}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REGLA DEL 10% ── */}
      <section className="section">
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <div className="tag">{t('landing.regla_tag')}</div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 800, marginBottom: 16 }}>
              {t('landing.regla_h2')}
            </h2>
            <p style={{ color: textMuted, lineHeight: 1.7, fontSize: '1rem', marginBottom: 20 }}>
              {t('landing.regla_p1')}
            </p>
            <p style={{ color: textMuted, lineHeight: 1.7, fontSize: '1rem' }}>
              {t('landing.regla_p2')}
            </p>
          </div>
          <div className="card" style={{ padding: 28 }}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: '0.72rem', color: textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hoy ganaste</p>
              <p style={{ fontSize: '1.6rem', fontWeight: 800, color: green }}>$45.000</p>
            </div>
            <div style={{ background: `${gold}10`, border: `1px solid ${gold}30`, borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.72rem', color: textMuted, fontWeight: 600 }}>Regla del 10%</p>
                  <p style={{ fontSize: '1.05rem', fontWeight: 800, color: gold }}>$4.500 sugeridos</p>
                </div>
                <div style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${gold}40`, background: `${gold}15`, color: gold, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                  📈 Registrar
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: '💚 Ingresos', value: '+$45.000', color: green },
                { label: '📈 Inversión', value: '-$4.500', color: gold },
                { label: '📊 Libre', value: '+$40.500', color: green, bold: true },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize: '0.82rem', color: textMuted }}>{row.label}</span>
                  <span style={{ fontSize: row.bold ? '0.92rem' : '0.85rem', fontWeight: row.bold ? 800 : 600, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── GRATIS SIN TRAMPA ── */}
      <section style={{ padding: '80px 24px', background: 'rgba(139,92,246,0.03)', borderTop: `1px solid ${borderSubtle}`, borderBottom: `1px solid ${borderSubtle}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <div className="tag">{t('landing.gratis_tag')}</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 12 }}>
            {t('landing.gratis_h2')}
          </h2>
          <p style={{ color: textMuted, marginBottom: 48, fontSize: '1rem', maxWidth: 480, margin: '0 auto 48px' }}>
            {t('landing.gratis_sub')}
          </p>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {gratisItems.map((item) => (
              <div key={item.text} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px' }}>
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MULTIIDIOMA ── */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="tag">{t('landing.idiomas_tag')}</div>
        <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 12 }}>
          {t('landing.idiomas_h2')}
        </h2>
        <p style={{ color: textMuted, marginBottom: 40, fontSize: '1rem' }}>
          {t('landing.idiomas_sub')}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
          {[
            { flag: '🇦🇷', name: 'Español' },
            { flag: '🇬🇧', name: 'English' },
            { flag: '🇧🇷', name: 'Português' },
            { flag: '🇫🇷', name: 'Français' },
            { flag: '🇮🇳', name: 'हिन्दी' },
            { flag: '🇸🇦', name: 'العربية' },
            { flag: '🇨🇳', name: '中文' },
            { flag: '🇯🇵', name: '日本語' },
            { flag: '🇮🇩', name: 'Indonesia' },
            { flag: '🇷🇺', name: 'Русский' },
          ].map((lang) => (
            <div key={lang.name} style={{ background: bgCard, border: `1px solid ${borderPurple}`, borderRadius: 12, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600 }}>
              <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
              <span style={{ color: textMuted }}>{lang.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── INSTALÁ COMO APP ── */}
      <section style={{ padding: '80px 24px', background: 'rgba(139,92,246,0.03)', borderTop: `1px solid ${borderSubtle}`, borderBottom: `1px solid ${borderSubtle}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
          <div className="tag">{t('landing.instalar_tag')}</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: 12 }}>
            {t('landing.instalar_h2')}
          </h2>
          <p style={{ color: textMuted, marginBottom: 48, fontSize: '1rem', maxWidth: 480, margin: '0 auto 48px' }}>
            {t('landing.instalar_sub')}
          </p>
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 720, margin: '0 auto' }}>
            <div className="card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: '1.6rem' }}>🤖</span>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Android (Chrome)</span>
              </div>
              {androidSteps.map((text, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: gradientCTA, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.72rem', fontWeight: 800, color: 'white' }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: '0.875rem', color: textMuted, lineHeight: 1.5, paddingTop: 2 }}>{text}</span>
                </div>
              ))}
            </div>
            <div className="card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: '1.6rem' }}>🍎</span>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>iPhone (Safari)</span>
              </div>
              {iosSteps.map((text, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: gradientCTA, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.72rem', fontWeight: 800, color: 'white' }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: '0.875rem', color: textMuted, lineHeight: 1.5, paddingTop: 2 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <p style={{ marginTop: 32, fontSize: '0.82rem', color: '#6b7280' }}>
            {t('landing.instalar_nota')}
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section style={{ padding: '100px 24px', textAlign: 'center', background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0b0520 70%)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Image src="/logo-transparent.png" alt="Amauta Libre" width={64} height={64} style={{ borderRadius: 16, marginBottom: 28, boxShadow: '0 8px 32px rgba(139,92,246,0.4)' }} />
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }}>
            {t('landing.cta_h2')}
          </h2>
          <p style={{ color: textMuted, fontSize: '1.05rem', marginBottom: 40, lineHeight: 1.6 }}>
            {t('landing.cta_sub')}
          </p>
          <Link href="/login" className="btn-cta" style={{ padding: '18px 44px', fontSize: '1.1rem', borderRadius: 14, boxShadow: '0 12px 40px rgba(139,92,246,0.35)', margin: '0 auto' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {t('landing.cta_btn')}
          </Link>

          {/* CTA secundario — Amauta Cloud */}
          <div style={{ marginTop: 32, padding: '20px 24px', borderRadius: 14, border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.06)' }}>
            <p style={{ fontSize: '0.8rem', color: textMuted, marginBottom: 10 }}>
              {t('landing.cta_cloud_q')}
            </p>
            <a href="https://amauta.cloud/landing" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
              {t('landing.cta_cloud_link')}
            </a>
          </div>

          <p style={{ marginTop: 24, fontSize: '0.82rem', color: '#6b7280' }}>
            {t('landing.cta_footer')}
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: `1px solid ${borderSubtle}`, padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, fontSize: '0.82rem', color: textMuted }}>
          <span>© {new Date().getFullYear()} Amauta Libre</span>
          <Link href="/privacidad" style={{ color: textMuted, textDecoration: 'none' }}>{t('landing.footer_privacidad')}</Link>
          <Link href="/terminos" style={{ color: textMuted, textDecoration: 'none' }}>{t('landing.footer_terminos')}</Link>
          <a href="https://amauta.cloud" target="_blank" rel="noopener noreferrer" style={{ color: textMuted, textDecoration: 'none' }}>Amauta Cloud</a>
          <a href="https://libreria.amauta.cloud" target="_blank" rel="noopener noreferrer" style={{ color: textMuted, textDecoration: 'none' }}>Librería</a>
          <a href="https://instagram.com/amauta.libre" target="_blank" rel="noopener noreferrer" style={{ color: textMuted, textDecoration: 'none' }}>Instagram</a>
          <a href="https://tiktok.com/@amauta.libre" target="_blank" rel="noopener noreferrer" style={{ color: textMuted, textDecoration: 'none' }}>TikTok</a>
          <a href="https://facebook.com/amauta.libre" target="_blank" rel="noopener noreferrer" style={{ color: textMuted, textDecoration: 'none' }}>Facebook</a>
        </div>
      </footer>

    </div>
  )
}
