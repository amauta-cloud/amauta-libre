'use client'

import { useState, useEffect } from 'react'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

type Status = 'idle' | 'loading' | 'subscribed' | 'denied' | 'unsupported'

export default function PushNotificationSetup() {
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    if (!('PushManager' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription()
    ).then(sub => {
      if (sub) setStatus('subscribed')
    }).catch(() => {})
  }, [])

  async function subscribe() {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      })
      setStatus('subscribed')
    } catch {
      setStatus(Notification.permission === 'denied' ? 'denied' : 'idle')
    }
  }

  async function unsubscribe() {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
    } catch {}
    setStatus('idle')
  }

  if (status === 'unsupported') return null

  return (
    <div style={{
      padding: '0.875rem 1rem', background: '#1a1730',
      borderRadius: '12px', border: '1px solid rgba(139,92,246,0.1)',
    }}>
      <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
        🔔 Recordatorio diario
      </div>

      {status === 'subscribed' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.82rem', color: '#10b981' }}>Activado — te avisamos cada día</span>
          <button onClick={unsubscribe} style={{ fontSize: '0.72rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem' }}>
            Desactivar
          </button>
        </div>
      )}

      {status === 'denied' && (
        <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
          Bloqueaste las notificaciones. Habilitálas en la config del navegador.
        </p>
      )}

      {(status === 'idle' || status === 'loading') && (
        <button
          onClick={subscribe}
          disabled={status === 'loading'}
          style={{
            width: '100%', padding: '0.55rem',
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: '8px', color: '#a78bfa',
            fontSize: '0.82rem', cursor: status === 'loading' ? 'default' : 'pointer',
            fontWeight: 500, opacity: status === 'loading' ? 0.6 : 1,
          }}
        >
          {status === 'loading' ? 'Activando...' : 'Activar recordatorio diario'}
        </button>
      )}
    </div>
  )
}
