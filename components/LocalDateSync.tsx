'use client'
import { useEffect } from 'react'

export default function LocalDateSync() {
  useEffect(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    document.cookie = `amauta-date=${local}; path=/; max-age=3600; SameSite=Strict`
  }, [])
  return null
}
