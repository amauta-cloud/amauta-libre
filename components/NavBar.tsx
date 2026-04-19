'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/tablero',       label: 'Tablero',       icon: '⚡' },
  { href: '/planificacion', label: 'Planificación',  icon: '✅' },
  { href: '/educacion',     label: 'Educación',      icon: '📚' },
]

export default function NavBar({ nombre, avatar }: { nombre?: string; avatar?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

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

        {/* User */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            {avatar ? (
              <img src={avatar} alt={nombre} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            ) : (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa', fontSize: '0.85rem', fontWeight: 700 }}>
                {nombre?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <span style={{ color: '#d1d5db', fontSize: '0.8rem', fontWeight: 500 }}>{nombre?.split(' ')[0] || 'Usuario'}</span>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '0.5rem', borderRadius: '8px',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            color: '#6b7280', fontSize: '0.78rem', cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            Salir
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
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .md-sidebar { display: flex !important; }
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </>
  )
}
