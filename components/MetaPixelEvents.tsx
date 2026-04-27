'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export default function MetaPixelEvents() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('welcome') === '1' && window.fbq) {
      window.fbq('track', 'CompleteRegistration')
    }
  }, [searchParams])

  return null
}
