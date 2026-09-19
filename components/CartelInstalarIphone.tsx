'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/i18n/LocaleContext'

// Cartel "Tenela en tu celular como una app" solo para iPhone/iPad: Safari no tiene
// cartel automático de instalar (Android sí, lo muestra Chrome solo).
// Aparece a los 4 segundos y solo si la app no está instalada; cerrar lo esconde 14 días.
// Usa los textos de instalación que ya existen en los 10 idiomas (landing.instalar_*).
// Misma lógica que la plantilla de la skill app-instalable-amauta.
const CLAVE = 'amautaLibreCartelApp'
const DIAS_OCULTO = 14
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)'

type Fase = 'oculto' | 'montado' | 'visible'

export default function CartelInstalarIphone() {
  const { t, locale, dir } = useLocale()
  const [fase, setFase] = useState<Fase>('oculto')
  const [dentroDeOtraApp, setDentroDeOtraApp] = useState(false)
  const [sinMovimiento, setSinMovimiento] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent || ''
    const esIOS =
      /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const yaInstalada =
      (navigator as Navigator & { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    if (!esIOS || yaInstalada) return
    try {
      if (Date.now() < (Number(localStorage.getItem(CLAVE)) || 0)) return
    } catch {}
    // Dentro de Instagram, Facebook o TikTok no se puede instalar: hay que abrir en Safari
    setDentroDeOtraApp(/FBAN|FBAV|Instagram|TikTok|Line\//i.test(ua))
    setSinMovimiento(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const timer = setTimeout(() => {
      setFase('montado')
      requestAnimationFrame(() => requestAnimationFrame(() => setFase('visible')))
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  if (fase === 'oculto') return null

  function cerrar() {
    setFase('montado')
    setTimeout(() => setFase('oculto'), 420)
    try {
      localStorage.setItem(CLAVE, String(Date.now() + DIAS_OCULTO * 864e5))
    } catch {}
  }

  const visible = fase === 'visible'

  return (
    <div
      id="cartel-app"
      className={`cartel-app${visible ? ' visible' : ''}`}
      role="dialog"
      aria-labelledby="cartel-app-titulo"
      dir={dir}
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 'calc(12px + env(safe-area-inset-bottom))',
        maxWidth: 496,
        margin: '0 auto',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 12px 14px 14px',
        background: '#16102a',
        border: '1px solid rgba(176,120,220,.45)',
        borderRadius: 18,
        boxShadow: '0 14px 40px rgba(0,0,0,.5)',
        fontFamily: 'var(--font-montserrat), Montserrat, sans-serif',
        opacity: visible ? 1 : 0,
        transform: visible || sinMovimiento ? 'none' : 'translateY(24px)',
        transition: sinMovimiento ? 'opacity 300ms ease' : `transform 420ms ${EASE}, opacity 420ms ${EASE}`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/apple-touch-icon.png" alt="" width={48} height={48} style={{ borderRadius: 11, flex: 'none' }} />
      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
        <strong id="cartel-app-titulo" style={{ display: 'block', color: '#f3f0ff', fontSize: 14.5, fontWeight: 700, marginBottom: 3 }}>
          {t('landing.instalar_h2')}
        </strong>
        <span className="cartel-app-pasos" style={{ display: 'block', color: '#c3b9d6', fontSize: 13, fontWeight: 500 }}>
          {dentroDeOtraApp ? t('landing.instalar_ios_1') : t('landing.instalar_ios_2')}
        </span>
        {!dentroDeOtraApp && (
          <span style={{ display: 'block', color: '#F9C850', fontSize: 13, fontWeight: 700, marginTop: 2 }}>
            {t('landing.instalar_ios_3')}
          </span>
        )}
      </div>
      <button
        type="button"
        className="cartel-app-cerrar"
        aria-label={locale === 'es' ? 'Cerrar' : 'Close'}
        onClick={cerrar}
        style={{
          flex: 'none',
          width: 36,
          height: 36,
          border: 0,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.08)',
          color: '#c3b9d6',
          fontSize: 16,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ✕
      </button>
    </div>
  )
}
