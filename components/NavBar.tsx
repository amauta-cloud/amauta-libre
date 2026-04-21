'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLocale, LOCALES, type Locale } from '@/lib/i18n/LocaleContext'

export default function NavBar({ nombre: initialNombre, avatar, userId }: { nombre?: string; avatar?: string; userId?: string }) {
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

  const NAV = [
    { href: '/tablero',       label: t('nav.tablero'),       icon: '⚡' },
    { href: '/planificacion', label: t('nav.planificacion'),  icon: '✅' },
    { href: '/educacion',     label: t('nav.educacion'),      icon: '📚' },
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
    await supabase.from('usuarios').update({ nombre: nombreInput.trim() }).eq('id', userId)
    setNombreSaving(false)
    setEditingNombre(false)
  }

  function handleLang(code: Locale) {
    setLocale(code)
  }

  const currentLocale = LOCALES.find(l => l.code === locale)

  const ConfigPanel = () => (
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
        }}
      >
        {/* Handle */}
        <div style={{ width: '36px', height: '4px', borderRadius: '99px', background: 'rgba(255,255,255,0.15)', margin: '0 auto -0.5rem' }} />

        {/* Perfil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {avatar ? (
            <img src={avatar} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%' }} />
          ) : (
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem', fontWeight: 700, flexShrink: 0 }}>
              {nombreInput?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div style={{ flex: 1 }}>
            {editingNombre ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  value={nombreInput}
                  onChange={e => setNombreInput(e.target.value)}
                  autoFocus
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

        {/* Cerrar sesión */}
        <button onClick={handleLogout} style={{
          width: '100%', padding: '0.75rem', borderRadius: '10px',
          border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)',
          color: '#ef4444', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
        }}>
          {t('nav.salir')}
        </button>

        {/* Eliminar cuenta */}
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)} style={{
            width: '100%', padding: '0.5rem', borderRadius: '8px',
            border: 'none', background: 'transparent',
            color: '#4b5563', fontSize: '0.72rem', cursor: 'pointer', textAlign: 'center',
          }}>
            {t('nav.eliminar_cuenta')}
          </button>
        ) : (
          <div style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
            <p style={{ color: '#fca5a5', fontSize: '0.78rem', marginBottom: '0.75rem', textAlign: 'center' }}>
              {t('nav.eliminar_desc')}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setDeleteConfirm(false)} style={{
                flex: 1, padding: '0.5rem', borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
                color: '#9ca3af', fontSize: '0.78rem', cursor: 'pointer',
              }}>
                Cancelar
              </button>
              <button onClick={handleDeleteAccount} disabled={deleting} style={{
                flex: 1, padding: '0.5rem', borderRadius: '8px',
                border: 'none', background: '#ef4444',
                color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: deleting ? 'default' : 'pointer',
                opacity: deleting ? 0.7 : 1,
              }}>
                {deleting ? t('nav.eliminando') : t('nav.eliminar_confirmar')}
              </button>
            </div>
          </div>
        )}

        {/* Legal links */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', paddingTop: '0.25rem' }}>
          <a href="/privacidad" style={{ color: '#374151', fontSize: '0.65rem', textDecoration: 'none' }}>Privacidad</a>
          <a href="/terminos" style={{ color: '#374151', fontSize: '0.65rem', textDecoration: 'none' }}>Términos</a>
        </div>
      </div>
    </div>
  )

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
      {avatar ? (
        <img src={avatar} alt="" style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', opacity: configOpen ? 1 : 0.85 }} />
      ) : (
        <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: mobile ? '0.65rem' : '0.85rem', flexShrink: 0 }}>
          {nombreInput?.[0]?.toUpperCase() || 'U'}
        </div>
      )}
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
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1rem', color: '#fff',
          }}>A</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>Amauta</div>
            <div style={{ color: '#7c3aed', fontSize: '0.7rem', fontWeight: 600 }}>Libre</div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV.map(({ href, label, icon }) => {
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
                <span style={{ fontSize: '1rem' }}>{icon}</span>
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
            {avatar ? (
              <img src={avatar} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
                {nombreInput?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
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
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem',
              padding: '0.5rem 0',
              color: active ? '#a78bfa' : '#6b7280',
              textDecoration: 'none', fontSize: '0.65rem', fontWeight: active ? 600 : 400,
              transition: 'color 0.15s',
            }}>
              <span style={{ fontSize: '1.3rem' }}>{icon}</span>
              {label}
            </Link>
          )
        })}
        <AvatarBtn size={24} mobile />
      </nav>

      {/* Config panel */}
      {configOpen && <ConfigPanel />}

      <style>{`
        @media (min-width: 768px) {
          .md-sidebar { display: flex !important; }
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </>
  )
}
