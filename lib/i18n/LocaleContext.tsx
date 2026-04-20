'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { es } from './locales/es'
import { en } from './locales/en'
import { pt } from './locales/pt'
import { fr } from './locales/fr'
import { zh } from './locales/zh'
import { hi } from './locales/hi'
import { ar } from './locales/ar'
import { ru } from './locales/ru'
import { id } from './locales/id'
import { ja } from './locales/ja'

export type Locale = 'es' | 'en' | 'pt' | 'fr' | 'zh' | 'hi' | 'ar' | 'ru' | 'id' | 'ja'

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'es', label: 'Español',    flag: '🇦🇷' },
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'zh', label: '中文',        flag: '🇨🇳' },
  { code: 'hi', label: 'हिन्दी',       flag: '🇮🇳' },
  { code: 'ar', label: 'العربية',     flag: '🇸🇦' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
  { code: 'id', label: 'Indonesia',  flag: '🇮🇩' },
  { code: 'ja', label: '日本語',       flag: '🇯🇵' },
]

const TRANSLATIONS: Record<Locale, typeof es> = { es, en, pt, fr, zh, hi, ar, ru, id, ja }

type TranslationDict = typeof es

function getNestedValue(obj: unknown, keys: string[]): string | undefined {
  let cur: unknown = obj
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[k]
  }
  return typeof cur === 'string' ? cur : undefined
}

type LocaleContextType = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  dir: 'ltr' | 'rtl'
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'es',
  setLocale: () => {},
  t: (key) => key,
  dir: 'ltr',
})

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es')

  useEffect(() => {
    const saved = localStorage.getItem('amauta-locale') as Locale | null
    if (saved && TRANSLATIONS[saved]) setLocaleState(saved)
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    localStorage.setItem('amauta-locale', l)
  }

  function t(key: string, vars?: Record<string, string | number>): string {
    const keys = key.split('.')
    let value = getNestedValue(TRANSLATIONS[locale], keys)
    if (!value) value = getNestedValue(TRANSLATIONS['es'], keys) ?? key
    if (vars) {
      value = value.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
    }
    return value
  }

  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, dir }}>
      <div dir={dir}>{children}</div>
    </LocaleContext.Provider>
  )
}

export const useLocale = () => useContext(LocaleContext)
