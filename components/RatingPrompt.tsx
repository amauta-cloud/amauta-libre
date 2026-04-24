'use client'

import { useState, useEffect } from 'react'

// Actualizar estas URLs cuando la app esté publicada
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=cloud.amauta.libre'
const APP_STORE_URL = '' // pendiente publicar en App Store

const STORAGE_KEY_DISMISSED = 'amauta_rating_dismissed'
const STORAGE_KEY_RATED = 'amauta_rated'
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
const MIN_RACHA = 5

export default function RatingPrompt({ racha }: { racha: number }) {
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState<'android' | 'ios' | null>(null)

  useEffect(() => {
    if (racha < MIN_RACHA) return
    if (localStorage.getItem(STORAGE_KEY_RATED)) return

    const dismissed = localStorage.getItem(STORAGE_KEY_DISMISSED)
    if (dismissed && Date.now() - parseInt(dismissed) < THIRTY_DAYS) return

    const ua = navigator.userAgent
    const isAndroid = /Android/i.test(ua)
    const isIOS = /iPhone|iPad|iPod/i.test(ua)
    if (!isAndroid && !isIOS) return

    setPlatform(isAndroid ? 'android' : 'ios')
    setShow(true)
  }, [racha])

  if (!show || !platform) return null

  const storeUrl = platform === 'android' ? PLAY_STORE_URL : APP_STORE_URL
  const storeLabel = platform === 'android' ? 'Google Play' : 'App Store'

  function dismiss(permanent: boolean) {
    if (permanent) {
      localStorage.setItem(STORAGE_KEY_RATED, 'true')
    } else {
      localStorage.setItem(STORAGE_KEY_DISMISSED, String(Date.now()))
    }
    setShow(false)
  }

  return (
    <div style={{
      background: 'rgba(245,197,24,0.07)', border: '1px solid rgba(245,197,24,0.22)',
      borderRadius: '14px', padding: '1rem 1.25rem',
    }}>
      <div style={{ fontSize: '0.7rem', color: '#F5C518', fontWeight: 700, marginBottom: '0.2rem' }}>
        ⭐ {racha} días de racha
      </div>
      <div style={{ color: '#e5e7eb', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.2rem' }}>
        ¿Te está ayudando Amauta?
      </div>
      <div style={{ color: '#6b7280', fontSize: '0.75rem', marginBottom: '0.875rem' }}>
        Tu calificación ayuda a más personas a descubrirla.
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {storeUrl ? (
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => dismiss(true)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px',
              background: 'rgba(245,197,24,0.18)', border: '1px solid rgba(245,197,24,0.35)',
              color: '#F5C518', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none',
            }}
          >
            ⭐ Calificar en {storeLabel}
          </a>
        ) : (
          <span style={{ fontSize: '0.72rem', color: '#4b5563', fontStyle: 'italic' }}>
            Próximamente en {storeLabel}
          </span>
        )}
        <button onClick={() => dismiss(false)} style={{
          padding: '0.45rem 0.75rem', borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.07)', background: 'none',
          color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer',
        }}>Más tarde</button>
        <button onClick={() => dismiss(true)} style={{
          padding: '0.45rem 0.75rem', borderRadius: '8px',
          border: 'none', background: 'none',
          color: '#4b5563', fontSize: '0.72rem', cursor: 'pointer',
        }}>No, gracias</button>
      </div>
    </div>
  )
}
