'use client'

import { useState, useEffect } from 'react'

export default function AdminNotasField({ usuarioId }: { usuarioId: string }) {
  const [nota, setNota] = useState('')
  const [original, setOriginal] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [notSupported, setNotSupported] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/notas?usuario_id=${usuarioId}`)
      .then(r => r.json())
      .then(data => {
        if (data.notSupported) { setNotSupported(true); return }
        const text = data.nota ?? ''
        setNota(text)
        setOriginal(text)
      })
      .catch(() => setNotSupported(true))
  }, [usuarioId])

  async function guardar() {
    if (saving) return
    setSaving(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/admin/notas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId, nota }),
      })
      if (res.ok) {
        setOriginal(nota)
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 2000)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  if (notSupported) return null

  const dirty = nota !== original

  return (
    <div style={{ background: '#1a1730', border: '1px solid rgba(139,92,246,0.1)', borderRadius: '14px', padding: '1.25rem', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h2 style={{ color: '#e5e7eb', fontSize: '0.82rem', fontWeight: 700, margin: 0 }}>
          Notas del admin
        </h2>
        {status === 'saved' && (
          <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>✓ Guardado</span>
        )}
        {status === 'error' && (
          <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>Error al guardar</span>
        )}
      </div>
      <textarea
        value={nota}
        onChange={e => setNota(e.target.value)}
        placeholder="Notas internas sobre este usuario (solo visibles para vos)..."
        rows={4}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '0.75rem',
          borderRadius: '8px', background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb',
          fontSize: '0.82rem', resize: 'vertical', outline: 'none',
          lineHeight: 1.6, fontFamily: 'inherit',
        }}
      />
      {dirty && (
        <button
          onClick={guardar}
          disabled={saving}
          style={{
            marginTop: '0.625rem', padding: '0.5rem 1rem', borderRadius: '8px',
            border: 'none', background: 'rgba(139,92,246,0.25)',
            color: '#a78bfa', fontSize: '0.78rem', fontWeight: 600,
            cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Guardando...' : 'Guardar nota'}
        </button>
      )}
    </div>
  )
}
