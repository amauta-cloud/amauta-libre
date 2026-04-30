import Link from 'next/link'

export default function NotFound() {
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
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌄</div>
      <h1 style={{ color: '#e5e7eb', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Página no encontrada
      </h1>
      <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '2rem', maxWidth: '320px' }}>
        Este camino no existe. Pero el tuyo sí.
      </p>
      <Link
        href="/tablero"
        style={{
          padding: '0.75rem 1.5rem',
          borderRadius: '10px',
          background: 'rgba(124,58,237,0.8)',
          color: '#fff',
          fontWeight: 600,
          fontSize: '0.9rem',
          textDecoration: 'none',
        }}
      >
        Volver al tablero
      </Link>
    </div>
  )
}
