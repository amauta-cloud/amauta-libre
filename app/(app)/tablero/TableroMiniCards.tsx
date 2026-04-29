'use client'

import Link from 'next/link'
import { useLocale } from '@/lib/i18n/LocaleContext'

interface Props {
  tareasVencidas: number
  tareasHoy: number
  tareasTotales: number
  educacionPaso: number
  meta30: string | null
}

export default function TableroMiniCards({ tareasVencidas, tareasHoy, tareasTotales, educacionPaso, meta30 }: Props) {
  const { t } = useLocale()

  const tareaColor = tareasVencidas > 0 ? '#ef4444' : tareasHoy > 0 ? '#f59e0b' : tareasTotales === 0 ? '#10b981' : '#f472b6'

  function getTareaLabel(): string {
    if (tareasVencidas > 0) return t('tablero.mini.tarea_vencidas', { n: tareasVencidas, s: tareasVencidas > 1 ? 's' : '' })
    if (tareasHoy > 0) return t('tablero.mini.tarea_hoy', { n: tareasHoy })
    if (tareasTotales === 0) return t('tablero.mini.al_dia')
    return t('tablero.mini.tarea_pendientes', { n: tareasTotales, s: tareasTotales > 1 ? 's' : '' })
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <Link href="/planificacion?tab=tareas" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#1a1730', borderRadius: '12px',
            border: `1px solid ${tareasVencidas > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.1)'}`,
            padding: '0.875rem 1rem', cursor: 'pointer', transition: 'border-color 0.2s',
          }}>
            <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{t('tablero.mini.tareas')}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: tareaColor }}>{tareasTotales === 0 ? '✓' : tareasTotales}</span>
              <span style={{ fontSize: '0.72rem', color: tareaColor }}>{getTareaLabel()}</span>
            </div>
          </div>
        </Link>

        <Link href="/educacion" style={{ textDecoration: 'none' }}>
          <div style={{
            background: '#1a1730', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.1)',
            padding: '0.875rem 1rem', cursor: 'pointer', transition: 'border-color 0.2s',
          }}>
            <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{t('tablero.mini.educacion')}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#60a5fa' }}>
                {educacionPaso >= 16 ? '🏆' : educacionPaso > 0 ? t('tablero.mini.paso_n', { n: educacionPaso }) : '—'}
              </span>
              {educacionPaso === 0 && (
                <span style={{ fontSize: '0.72rem', color: '#4b5563' }}>{t('tablero.mini.sin_iniciar')}</span>
              )}
              {educacionPaso > 0 && educacionPaso < 16 && (
                <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{t('tablero.mini.en_curso')}</span>
              )}
            </div>
          </div>
        </Link>
      </div>

      <Link href="/metas" style={{ textDecoration: 'none', display: 'block', marginBottom: '1rem' }}>
        <div style={{
          background: meta30 ? 'rgba(16,185,129,0.06)' : '#1a1730',
          border: `1px solid ${meta30 ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.1)'}`,
          borderRadius: '12px', padding: '0.875rem 1rem', cursor: 'pointer', transition: 'border-color 0.2s',
        }}>
          <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>⚓ {t('tablero.mini.meta_mes')}</div>
          <div style={{ color: meta30 ? '#6ee7b7' : '#4b5563', fontSize: '0.85rem', fontWeight: meta30 ? 500 : 400 }}>
            {meta30
              ? (meta30.length > 80 ? meta30.slice(0, 80) + '...' : meta30)
              : t('tablero.mini.meta_cta')}
          </div>
        </div>
      </Link>
    </>
  )
}
