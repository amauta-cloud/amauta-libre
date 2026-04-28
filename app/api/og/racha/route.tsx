import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const MENSAJES: Record<number, string> = {
  7:   '¡Una semana sin parar!',
  14:  '¡Dos semanas!',
  21:  '¡21 días — ya es hábito!',
  30:  '¡Un mes completo!',
  60:  '¡Dos meses seguidos!',
  66:  '¡66 días — se automatizó!',
  90:  '¡Tres meses de racha!',
  100: '¡100 días — extraordinario!',
  180: '¡Medio año sin parar!',
  365: '¡Un año completo! 👑',
}

function getMensaje(dias: number): string {
  const milestones = Object.keys(MENSAJES).map(Number).sort((a, b) => b - a)
  for (const m of milestones) {
    if (dias >= m) return MENSAJES[m]
  }
  return `${dias} días de constancia`
}

export async function GET(req: NextRequest) {
  const dias = parseInt(req.nextUrl.searchParams.get('dias') ?? '0', 10)
  const nombre = req.nextUrl.searchParams.get('nombre') ?? ''
  const mensaje = getMensaje(dias)

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#0f0d1a',
          position: 'relative',
        }}
      >
        {/* Purple glow circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)',
            display: 'flex',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Top label */}
        {nombre ? (
          <div
            style={{
              fontSize: '32px',
              color: '#6b7280',
              fontWeight: 500,
              marginBottom: '32px',
              letterSpacing: '0.04em',
              display: 'flex',
            }}
          >
            {nombre}
          </div>
        ) : null}

        {/* Flame */}
        <div style={{ fontSize: '88px', lineHeight: 1, marginBottom: '16px', display: 'flex' }}>
          🔥
        </div>

        {/* Days number */}
        <div
          style={{
            fontSize: '160px',
            fontWeight: 900,
            color: '#a78bfa',
            lineHeight: 1,
            marginBottom: '8px',
            display: 'flex',
          }}
        >
          {dias}
        </div>

        {/* Label */}
        <div
          style={{
            fontSize: '40px',
            color: '#e5e7eb',
            fontWeight: 700,
            marginBottom: '32px',
            display: 'flex',
          }}
        >
          días de racha
        </div>

        {/* Message */}
        <div
          style={{
            fontSize: '28px',
            color: '#c4b5fd',
            fontWeight: 500,
            marginBottom: '56px',
            display: 'flex',
          }}
        >
          {mensaje}
        </div>

        {/* Divider */}
        <div
          style={{
            width: '64px',
            height: '2px',
            background: 'rgba(139,92,246,0.35)',
            marginBottom: '28px',
            display: 'flex',
          }}
        />

        {/* Branding */}
        <div
          style={{
            fontSize: '22px',
            color: '#374151',
            fontWeight: 600,
            letterSpacing: '0.12em',
            display: 'flex',
          }}
        >
          AMAUTA LIBRE · libre.amauta.cloud
        </div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
