'use client'
import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/i18n/LocaleContext'

export default function DiaHeader() {
  const { locale } = useLocale()
  const [label, setLabel] = useState('')

  useEffect(() => {
    const d = new Date()
    const raw = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    }).format(d)
    setLabel(raw.charAt(0).toUpperCase() + raw.slice(1))
  }, [locale])

  return (
    <p style={{ color: '#7c3aed', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
      {label}
    </p>
  )
}
