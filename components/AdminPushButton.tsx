'use client'

import { useState } from 'react'

type BtnState = 'idle' | 'sending' | 'done' | 'error'

function CronTestBtn({ label, url }: { label: string; url: string }) {
  const [state, setState] = useState<BtnState>('idle')
  const [result, setResult] = useState<{ sent?: number; error?: string } | null>(null)

  async function trigger() {
    if (state === 'sending') return
    setState('sending')
    try {
      const res = await fetch(url)
      const data = await res.json()
      setResult(data)
      setState(data.error ? 'error' : 'done')
    } catch {
      setState('error')
    }
  }

  return (
    <button
      onClick={trigger}
      disabled={state === 'sending'}
      style={{
        padding: '0.4rem 0.75rem',
        borderRadius: '8px',
        border: '1px solid rgba(139,92,246,0.3)',
        background: state === 'done' ? 'rgba(16,185,129,0.15)' : state === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(139,92,246,0.1)',
        color: state === 'done' ? '#10b981' : state === 'error' ? '#ef4444' : '#a78bfa',
        fontSize: '0.72rem',
        fontWeight: 600,
        cursor: state === 'sending' ? 'default' : 'pointer',
        opacity: state === 'sending' ? 0.6 : 1,
        whiteSpace: 'nowrap' as const,
      }}
    >
      {state === 'sending' ? '...' : state === 'done' ? `✓ sent:${result?.sent}` : state === 'error' ? `✗ ${result?.error ?? 'error'}` : label}
    </button>
  )
}

export default function AdminPushButton({ totalSubs }: { totalSubs: number }) {
  const [estado, setEstado] = useState<BtnState>('idle')
  const [resultado, setResultado] = useState<{ sent: number; total: number } | null>(null)

  async function enviar() {
    if (estado === 'sending') return
    setEstado('sending')
    try {
      const res = await fetch('/api/admin/push', { method: 'POST' })
      const data = await res.json()
      setResultado(data)
      setEstado('done')
    } catch {
      setEstado('error')
    }
  }

  if (totalSubs === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' as const }}>
        <button
          onClick={enviar}
          disabled={estado === 'sending'}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '1px solid rgba(245,158,11,0.3)',
            background: estado === 'done' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.12)',
            color: estado === 'done' ? '#10b981' : '#f59e0b',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: estado === 'sending' ? 'default' : 'pointer',
            opacity: estado === 'sending' ? 0.6 : 1,
            whiteSpace: 'nowrap' as const,
          }}
        >
          {estado === 'sending' ? 'Enviando...' : estado === 'done' ? `✓ Enviado a ${resultado?.sent}` : `🔔 Enviar push ahora (${totalSubs})`}
        </button>
        {estado === 'error' && (
          <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>Error al enviar</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>Test crons:</span>
        <CronTestBtn label="☀️ mañana" url="/api/push/daily-reminder" />
        <CronTestBtn label="🌙 noche" url="/api/push/noche-recordatorio" />
      </div>
    </div>
  )
}
