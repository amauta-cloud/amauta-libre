'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLocale, LOCALES, type Locale } from '@/lib/i18n/LocaleContext'
import { ONBOARDING_STORAGE_KEY } from '@/components/OnboardingTutorial'
import PushNotificationSetup from '@/components/PushNotificationSetup'

const PRESET_AVATARS = [
  { id: 'lion',    emoji: '🦁', bg: '#7c3aed' },
  { id: 'owl',     emoji: '🦉', bg: '#0369a1' },
  { id: 'phoenix', emoji: '🦅', bg: '#b45309' },
  { id: 'wolf',    emoji: '🐺', bg: '#374151' },
  { id: 'fox',     emoji: '🦊', bg: '#c2410c' },
  { id: 'tiger',   emoji: '🐯', bg: '#a16207' },
  { id: 'panda',   emoji: '🐼', bg: '#166534' },
  { id: 'dragon',  emoji: '🐉', bg: '#7e22ce' },
  { id: 'bear',    emoji: '🐻', bg: '#92400e' },
  { id: 'hawk',    emoji: '🦆', bg: '#0f766e' },
]

const AVATAR_PRESET_KEY = 'amauta_avatar_preset'

export default function NavBar({ nombre: initialNombre, avatar, userId, educacionPaso = 0 }: { nombre?: string; avatar?: string; userId?: string; educacionPaso?: number }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { t, locale, setLocale } = useLocale()
  const [configOpen, setConfigOpen] = useState(false)
  const [editingNombre, setEditingNombre] = useState(false)
  const [nombreInput, setNombreInput] = useState(initialNombre || '')
  const [nombreSaving, setNombreSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [presetId, setPresetId] = useState<string | null>(null)
  const [pickingAvatar, setPickingAvatar] = useState(false)
  const [soporteOpen, setSoporteOpen] = useState(false)
  const [soporteText, setSoporteText] = useState('')
  const [soporteCategoria, setSoporteCategoria] = useState<'bug' | 'sugerencia' | 'otro'>('otro')
  const [soporteStatus, setSoporteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    const saved = localStorage.getItem(AVATAR_PRESET_KEY)
    if (saved) setPresetId(saved)
  }, [])

  function selectPreset(id: string) {
    localStorage.setItem(AVATAR_PRESET_KEY, id)
    setPresetId(id)
    setPickingAvatar(false)
  }

  const activePreset = PRESET_AVATARS.find(p => p.id === presetId)

  const eduBadge = educacionPaso > 0 && educacionPaso < 11 ? `${educacionPaso}/11` : null
  const NAV = [
    { href: '/tablero',       label: t('nav.tablero'),       icon: '⚡',  badge: null },
    { href: '/planificacion', label: t('nav.planificacion'),  icon: '✅',  badge: null },
    { href: '/educacion',     label: t('nav.educacion'),      icon: '📚', badge: eduBadge },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch('/api/delete-account', { method: 'DELETE' })
      if (res.ok) {
        await supabase.auth.signOut()
        router.push('/login')
      }
    } finally {
      setDeleting(false)
    }
  }

  async function saveNombre() {
    if (!nombreInput.trim() || !userId) return
    setNombreSaving(true)
    const { error } = await supabase.from('usuarios').update({ nombre: nombreInput.trim() }).eq('id', userId)
    setNombreSaving(false)
    if (!error) setEditingNombre(false)
  }

  function handleLang(code: Locale) {
    setLocale(code)
  }

  async function enviarSoporte() {
    if (!soporteText.trim() || !userId) return
    setSoporteStatus('sending')
    const { error } = await supabase.from('soporte_mensajes').insert({
      usuario_id: userId,
      mensaje: soporteText.trim(),
      categoria: soporteCategoria,
    })
    if (error) {
      setSoporteStatus('error')
    } else {
      setSoporteStatus('sent')
      setSoporteText('')
    }
  }

  const currentLocale = LOCALES.find(l => l.code === locale)

  const configPanelJSX = configOpen ? (
    <div
      onClick={() => setConfigOpen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '500px',
          background: '#1a1730',
          border: '1px solid rgba(139,92,246,0.25)',
          borderRadius: '20px 20px 0 0',
          padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '1.25rem',
          maxHeight: '88vh', overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ width: '36px', height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.15)', margin: '0 auto -0.5rem' }} />

        {/* Perfil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatar && !avatarFailed ? (
              <img src={avatar} alt="" referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} style={{ width: '44px', height: '44px', borderRadius: '50%' }} />
            ) : activePreset ? (
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: activePreset.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                {activePreset.emoji}
              </div>
            ) : (
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem', fontWeight: 700, flexShrink: 0 }}>
                {nombreInput?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <button
              onClick={() => setPickingAvatar(o => !o)}
              style={{ position: 'absolute', bottom: -2, right: -2, width: '18px', height: '18px', borderRadius: '50%', background: '#1a1730', border: '1px solid rgba(139,92,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.6rem', padding: 0 }}
              title="Cambiar avatar"
            >
              ✏️
            </button>
          </div>
          <div style={{ flex: 1 }}>
            {editingNombre ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  value={nombreInput}
                  onChange={e => setNombreInput(e.target.value)}
                  autoFocus
                  maxLength={50}
                  onKeyDown={e => { if (e.key === 'Enter') saveNombre(); if (e.key === 'Escape') setEditingNombre(false) }}
                  style={{ flex: 1, padding: '0.4rem 0.625rem', borderRadius: '8px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(139,92,246,0.3)', color: '#f3f0ff', fontSize: '0.875rem', outline: 'none' }}
                />
                <button onClick={saveNombre} disabled={nombreSaving} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none', background: '#8B5CF6', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                  {nombreSaving ? '...' : '✓'}
                </button>
                <button onClick={() => { setEditingNombre(false); setNombreInput(initialNombre || '') }} style={{ padding: '0.4rem 0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer' }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#f3f0ff', fontWeight: 600, fontSize: '0.95rem' }}>{nombreInput || 'Usuario'}</span>
                <button onClick={() => setEditingNombre(true)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.75rem', padding: '0.1rem 0.3rem' }}>✏️</button>
              </div>
            )}
          </div>
        </div>

        {/* Avatar picker */}
        {pickingAvatar && (
          <div style={{ padding: '0.875rem', borderRadius: '12px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <div style={{ fontSize: '0.68rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>Elegí tu personaje</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {PRESET_AVATARS.map(p => (
                <button
                  key={p.id}
                  onClick={() => selectPreset(p.id)}
                  style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: p.bg,
                    border: presetId === p.id ? '2px solid #a78bfa' : '2px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', cursor: 'pointer',
                    boxShadow: presetId === p.id ? '0 0 0 2px rgba(139,92,246,0.4)' : 'none',
                  }}
                >
                  {p.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Idioma */}
        <div>
          <div style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>{t('nav.language')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {LOCALES.map(l => (
              <button key={l.code} onClick={() => handleLang(l.code)} style={{
                padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none',
                background: l.code === locale ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)',
                color: l.code === locale ? '#a78bfa' : '#9ca3af',
                fontWeight: l.code === locale ? 700 : 400,
                fontSize: '0.78rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}>
                <span>{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notificaciones push */}
        <PushNotificationSetup />

        {/* Ver guía de nuevo */}
        <button
          onClick={() => {
            localStorage.removeItem(ONBOARDING_STORAGE_KEY)
            setConfigOpen(false)
            window.location.reload()
          }}
          style={{
            width: '100%', padding: '0.65rem', borderRadius: '10px',
            border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.06)',
            color: '#a78bfa', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer',
          }}
        >
          🗺️ {t('onboarding.volver')}
        </button>

        {/* Soporte / Feedback */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
          <button
            onClick={() => { setSoporteOpen(o => !o); setSoporteStatus('idle') }}
            style={{
              width: '100%', padding: '0.65rem', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)', background: soporteOpen ? 'rgba(255,255,255,0.04)' : 'transparent',
              color: '#9ca3af', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span>{t('nav.soporte_btn')}</span>
            <span style={{ fontSize: '0.7rem', color: '#4b5563' }}>{soporteOpen ? '▲' : '▼'}</span>
          </button>

          {soporteOpen && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {soporteStatus === 'sent' ? (
                <div style={{
                  padding: '0.875rem', borderRadius: '10px', textAlign: 'center',
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>✅</div>
                  <div style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>{t('nav.soporte_ok_titulo')}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>{t('nav.soporte_ok_sub')}</div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    {(['bug', 'sugerencia', 'otro'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSoporteCategoria(cat)}
                        style={{
                          flex: 1, padding: '0.35rem 0.25rem', borderRadius: '8px', fontSize: '0.72rem',
                          border: '1px solid',
                          borderColor: soporteCategoria === cat ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.07)',
                          background: soporteCategoria === cat ? 'rgba(139,92,246,0.15)' : 'transparent',
                          color: soporteCategoria === cat ? '#a78bfa' : '#6b7280',
                          cursor: 'pointer', fontWeight: soporteCategoria === cat ? 600 : 400,
                        }}
                      >
                        {cat === 'bug' ? t('nav.soporte_bug') : cat === 'sugerencia' ? t('nav.soporte_idea') : t('nav.soporte_otro')}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={soporteText}
                    onChange={e => setSoporteText(e.target.value)}
                    placeholder={t('nav.soporte_placeholder')}
                    rows={3}
                    maxLength={500}
                    style={{
                      width: '100%', padding: '0.625rem', borderRadius: '8px', resize: 'none',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#d1d5db', fontSize: '0.82rem', lineHeight: 1.55, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {soporteStatus === 'error' && (
                    <div style={{ color: '#f87171', fontSize: '0.72rem', textAlign: 'center' }}>
                      {t('nav.soporte_error')}
                    </div>
                  )}
                  <button
                    onClick={enviarSoporte}
                    disabled={!soporteText.trim() || soporteStatus === 'sending'}
                    style={{
                      width: '100%', padding: '0.6rem', borderRadius: '8px', border: 'none',
                      background: soporteText.trim() ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)',
                      color: soporteText.trim() ? '#a78bfa' : '#4b5563',
                      fontSize: '0.82rem', fontWeight: 600, cursor: soporteText.trim() ? 'pointer' : 'default',
                    }}
                  >
                    {soporteStatus === 'sending' ? t('nav.soporte_enviando') : t('nav.soporte_enviar')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Cerrar sesión */}
        <button onClick={handleLogout} style={{
          width: '100%', padding: '0.75rem', borderRadius: '10px',
          border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)',
          color: '#ef4444', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
        }}>
          {t('nav.salir')}
        </button>

        {/* Legal links */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a href="/privacidad" style={{ color: '#374151', fontSize: '0.65rem', textDecoration: 'none' }}>{t('nav.privacidad')}</a>
          <a href="/terminos" style={{ color: '#374151', fontSize: '0.65rem', textDecoration: 'none' }}>{t('nav.terminos')}</a>
        </div>

        {/* Zona de peligro */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', marginTop: '0.25rem' }}>
          <div style={{ fontSize: '0.65rem', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', marginBottom: '0.75rem' }}>
            {t('nav.zona_peligro')}
          </div>

          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)} style={{
              width: '100%', padding: '0.6rem', borderRadius: '8px',
              border: '1px solid rgba(239,68,68,0.15)', background: 'transparent',
              color: '#6b7280', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'center',
            }}>
              {t('nav.eliminar_cuenta')}
            </button>
          ) : (
            <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.06)' }}>
              <div style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '0.5rem' }}>⚠️</div>
              <p style={{ color: '#fca5a5', fontSize: '0.82rem', marginBottom: '0.375rem', textAlign: 'center', fontWeight: 700 }}>
                {t('nav.eliminar_alerta')}
              </p>
              <p style={{ color: '#9ca3af', fontSize: '0.74rem', marginBottom: '1rem', textAlign: 'center', lineHeight: 1.5 }}>
                {t('nav.eliminar_detalle')}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setDeleteConfirm(false)} style={{
                  flex: 1, padding: '0.6rem', borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)',
                  color: '#d1d5db', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                }}>
                  {t('common.cancel')}
                </button>
                <button onClick={handleDeleteAccount} disabled={deleting} style={{
                  flex: 1, padding: '0.6rem', borderRadius: '8px',
                  border: 'none', background: '#ef4444',
                  color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: deleting ? 'default' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}>
                  {deleting ? t('nav.eliminando') : t('nav.eliminar_confirmar')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null

  const AvatarDisplay = ({ size, emojiSize, mobile = false }: { size: number; emojiSize: string; mobile?: boolean }) => {
    if (avatar && !avatarFailed) {
      return <img src={avatar} alt="" referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', opacity: configOpen ? 1 : 0.85, flexShrink: 0 }} />
    }
    if (activePreset) {
      return (
        <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: activePreset.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: emojiSize, flexShrink: 0, opacity: configOpen ? 1 : 0.85 }}>
          {activePreset.emoji}
        </div>
      )
    }
    return (
      <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: mobile ? '0.65rem' : '0.85rem', flexShrink: 0 }}>
        {nombreInput?.[0]?.toUpperCase() || 'U'}
      </div>
    )
  }

  const AvatarBtn = ({ size = 32, mobile = false }: { size?: number; mobile?: boolean }) => (
    <button
      onClick={() => setConfigOpen(o => !o)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        display: 'flex', flexDirection: mobile ? 'column' : 'row',
        alignItems: 'center', gap: mobile ? '0.2rem' : '0.6rem',
        ...(mobile ? { flex: 1, justifyContent: 'center', paddingTop: '0.5rem', paddingBottom: '0.5rem' } : {}),
      }}
    >
      <AvatarDisplay size={size} emojiSize={mobile ? '0.9rem' : '1.1rem'} mobile={mobile} />
      {mobile && <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>{t('nav.config')}</span>}
    </button>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        display: 'none',
        width: '220px', flexShrink: 0,
        background: '#1a1730',
        borderRight: '1px solid rgba(139,92,246,0.12)',
        flexDirection: 'column',
        padding: '1.5rem 1rem',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
      }} className="md-sidebar">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem', paddingLeft: '0.5rem' }}>
          <img src="/logo-transparent.png" alt="Amauta Libre" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Amauta</div>
            <div style={{ color: '#7c3aed', fontSize: '0.7rem', fontWeight: 600 }}>Libre</div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV.map(({ href, label, icon, badge }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.65rem 0.75rem', borderRadius: '10px',
                background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                color: active ? '#a78bfa' : '#9ca3af',
                fontWeight: active ? 600 : 400,
                fontSize: '0.875rem',
                textDecoration: 'none',
                transition: 'all 0.15s',
                border: active ? '1px solid rgba(139,92,246,0.2)' : '1px solid transparent',
              }}>
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                  {badge && (
                    <span style={{
                      position: 'absolute', top: '-4px', right: '-10px',
                      background: '#8B5CF6', color: '#fff', fontSize: '0.45rem', fontWeight: 700,
                      padding: '0.1rem 0.25rem', borderRadius: '99px', lineHeight: 1.2, whiteSpace: 'nowrap',
                    }}>{badge}</span>
                  )}
                </div>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Config button — desktop */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
          <button onClick={() => setConfigOpen(o => !o)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.5rem 0.75rem', borderRadius: '10px',
            background: configOpen ? 'rgba(139,92,246,0.12)' : 'transparent',
            border: '1px solid rgba(255,255,255,0.07)',
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <AvatarDisplay size={30} emojiSize="1rem" />
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ color: '#d1d5db', fontSize: '0.78rem', fontWeight: 500 }}>{nombreInput?.split(' ')[0] || 'Usuario'}</div>
              <div style={{ color: '#6b7280', fontSize: '0.65rem' }}>{t('nav.config')}</div>
            </div>
            <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>⚙️</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: '#1a1730',
        borderTop: '1px solid rgba(139,92,246,0.15)',
        display: 'flex',
        padding: '0.5rem 0',
      }} className="mobile-nav">
        {NAV.map(({ href, label, icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
              padding: '0.5rem 0',
              color: active ? '#a78bfa' : '#6b7280',
              textDecoration: 'none', fontSize: '0.65rem', fontWeight: active ? 600 : 400,
              transition: 'color 0.15s',
            }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.3rem' }}>{icon}</span>
                {badge && (
                  <span style={{
                    position: 'absolute', top: '-3px', right: '-8px',
                    background: '#8B5CF6', color: '#fff', fontSize: '0.45rem', fontWeight: 700,
                    padding: '0.1rem 0.2rem', borderRadius: '99px', lineHeight: 1.2, whiteSpace: 'nowrap',
                  }}>{badge}</span>
                )}
              </div>
              {label}
            </Link>
          )
        })}
        <AvatarBtn size={24} mobile />
      </nav>

      {/* Config panel */}
      {configPanelJSX}

      <style>{`
        @media (min-width: 768px) {
          .md-sidebar { display: flex !important; }
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </>
  )
}
