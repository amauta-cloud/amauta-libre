'use client'

import { useState } from 'react'

export default function AdminPushButton({ totalSubs }: { totalSubs: number }) {
  const [estado, setEstado] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
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
  )
}
