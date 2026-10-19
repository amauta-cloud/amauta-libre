'use client'

// 18/10/2026: los avisos se ofrecían solo en la guía del primer ingreso (antes de tildar nada: casi todos tocan
// «Ahora no») y escondidos en Configuración → 12 de 94 los activaron. Acá se ofrecen DESPUÉS del primer tilde
// del día, que es cuando la persona ya vio para qué sirve. «Ahora no» lo guarda 7 días. Mismos textos (10 idiomas).
import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/i18n/LocaleContext'

const CLAVE = 'oferta-recordatorio-cerrada'
const SIETE_DIAS = 7 * 24 * 60 * 60 * 1000

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0))) as Uint8Array<ArrayBuffer>
}

export default function OfertaRecordatorio() {
  const { t } = useLocale()
  const [ver, setVer] = useState(false)
  const [estado, setEstado] = useState<'idle' | 'loading' | 'listo'>('idle')

  useEffect(() => {
    try {
      // en algunos iPhone (Safari sin instalar) no existe Notification: sin esto se rompía
      if (!('PushManager' in window) || !('serviceWorker' in navigator) || typeof Notification === 'undefined') return
      if (Notification.permission === 'denied') return
      const cerrada = Number(localStorage.getItem(CLAVE) || 0)
      if (cerrada && Date.now() - cerrada < SIETE_DIAS) return
      navigator.serviceWorker.ready
        .then(reg => reg.pushManager.getSubscription())
        .then(sub => { if (!sub) setVer(true) })
        .catch(() => {})
    } catch {}
  }, [])

  async function activar() {
    setEstado('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })
      await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) })
      setEstado('listo')
      setTimeout(() => setVer(false), 2500)
    } catch {
      setEstado('idle')
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') setVer(false)
    }
  }

  function ahoraNo() {
    try { localStorage.setItem(CLAVE, String(Date.now())) } catch {}
    setVer(false)
  }

  if (!ver) return null
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(139,92,246,0.14), rgba(249,200,80,0.10))',
      border: '1px solid rgba(139,92,246,0.35)', borderRadius: '14px', padding: '0.9rem 1rem', marginBottom: '0.9rem',
    }}>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f2eefb' }}>🔔 {t('onboarding.push_title')}</div>
      <p style={{ fontSize: '0.78rem', color: '#b9b2d0', margin: '0.3rem 0 0.7rem' }}>{t('onboarding.push_desc')}</p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={activar} disabled={estado !== 'idle'} style={{
          flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '0.85rem', color: 'white',
          background: estado === 'listo' ? '#10b981' : 'linear-gradient(135deg, #8B5CF6, #EC4899)', cursor: estado === 'idle' ? 'pointer' : 'default',
          opacity: estado === 'loading' ? 0.7 : 1,
        }}>
          {estado === 'listo' ? t('onboarding.push_listo') : estado === 'loading' ? t('onboarding.push_activando') : t('onboarding.push_activar')}
        </button>
        {estado === 'idle' && (
          <button onClick={ahoraNo} style={{
            padding: '0.6rem 0.9rem', borderRadius: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            color: '#7d7699', fontSize: '0.8rem', cursor: 'pointer',
          }}>{t('onboarding.push_ahora_no')}</button>
        )}
      </div>
    </div>
  )
}
