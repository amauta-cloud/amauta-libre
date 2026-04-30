'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
      <h1 style={{ color: '#e5e7eb', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Algo salió mal
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '2rem', maxWidth: '320px' }}>
        Ocurrió un error inesperado. Ya lo estamos revisando.
      </p>
      <button
        onClick={reset}
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '10px',
          background: 'rgba(124,58,237,0.8)',
          border: 'none',
          color: '#fff',
          fontWeight: 600,
          fontSize: '0.9rem',
          cursor: 'pointer',
        }}
      >
        Intentar de nuevo
      </button>
    </div>
  )
}
