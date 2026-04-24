'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/i18n/LocaleContext'

export default function SaludoHeader({ nombre }: { nombre: string }) {
  const { t } = useLocale()
  const [saludo, setSaludo] = useState('')

  useEffect(() => {
    const hora = new Date().getHours()
    if (!nombre) {
      setSaludo(t('tablero.saludo.fallback'))
      return
    }
    if (hora >= 5 && hora < 12) setSaludo(t('tablero.saludo.buenos_dias', { nombre }))
    else if (hora >= 12 && hora < 19) setSaludo(t('tablero.saludo.buenas_tardes', { nombre }))
    else setSaludo(t('tablero.saludo.buenas_noches', { nombre }))
  }, [nombre, t])

  return (
    <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>
      {saludo || (nombre ? `${nombre}` : t('tablero.saludo.fallback'))}
    </h1>
  )
}
