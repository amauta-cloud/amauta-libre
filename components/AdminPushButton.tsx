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

function CustomPushForm() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [state, setState] = useState<BtnState>('idle')
  const [result, setResult] = useState<{ sent?: number } | null>(null)

  async function enviar() {
    if (state === 'sending' || !title.trim() || !body.trim()) return
    setState('sending')
    try {
      const res = await fetch('/api/admin/push-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      })
      const data = await res.json()
      setResult(data)
      setState(data.error ? 'error' : 'done')
    } catch {
      setState('error')
    }
  }

  function reset() {
    setState('idle')
    setResult(null)
    setTitle('')
    setBody('')
  }

  return (
    <div>
      <button
        onClick={() => { setOpen(o => !o); reset() }}
        style={{
          padding: '0.4rem 0.75rem',
          borderRadius: '8px',
          border: '1px solid rgba(59,130,246,0.3)',
          background: open ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)',
          color: '#60a5fa',
          fontSize: '0.72rem',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap' as const,
        }}
      >
        ✍️ mensaje libre
      </button>

      {open && (
        <div style={{
          marginTop: '0.625rem',
          padding: '0.875rem',
          borderRadius: '10px',
          border: '1px solid rgba(59,130,246,0.2)',
          background: 'rgba(59,130,246,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}>
          {state === 'done' ? (
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>✓ Enviado a {result?.sent} dispositivos</div>
              <button onClick={reset} style={{ marginTop: '0.5rem', padding: '0.3rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#6b7280', fontSize: '0.72rem', cursor: 'pointer' }}>
                Otro mensaje
              </button>
            </div>
          ) : (
            <>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Título del mensaje"
                style={{
                  padding: '0.5rem 0.625rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#f3f0ff',
                  fontSize: '0.8rem',
                  outline: 'none',
                }}
              />
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Cuerpo del mensaje..."
                rows={2}
                style={{
                  padding: '0.5rem 0.625rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#f3f0ff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  resize: 'none',
                }}
              />
              {state === 'error' && (
                <span style={{ color: '#ef4444', fontSize: '0.72rem' }}>Error al enviar</span>
              )}
              <button
                onClick={enviar}
                disabled={!title.trim() || !body.trim() || state === 'sending'}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: title.trim() && body.trim() ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.05)',
                  color: title.trim() && body.trim() ? '#60a5fa' : '#4b5563',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: title.trim() && body.trim() ? 'pointer' : 'default',
                  opacity: state === 'sending' ? 0.6 : 1,
                }}
              >
                {state === 'sending' ? 'Enviando...' : '📨 Enviar a todos'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
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
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' as const }}>
        <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>Test crons:</span>
        <CronTestBtn label="☀️ mañana" url="/api/push/daily-reminder" />
        <CronTestBtn label="🌙 noche" url="/api/push/noche-recordatorio" />
      </div>
      <CustomPushForm />
    </div>
  )
}
