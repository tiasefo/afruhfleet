'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

type Locale = 'en' | 'zh'
type Translations = Record<string, string>

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
  ready: boolean
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
  ready: false,
})

const cache: Record<string, Translations> = {}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [translations, setTranslations] = useState<Translations>({})
  const [ready, setReady] = useState(false)

  const loadTranslations = useCallback(async (lang: Locale) => {
    if (cache[lang]) {
      setTranslations(cache[lang])
      setReady(true)
      return
    }
    try {
      const res = await fetch(`/api/v1/i18n/translations/${lang}`)
      if (res.ok) {
        const data = await res.json()
        cache[lang] = data
        setTranslations(data)
      }
    } catch {
      // Fallback: keep current translations
    }
    setReady(true)
  }, [])

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('locale') : null
    if (saved === 'zh' || saved === 'en') {
      setLocaleState(saved)
      loadTranslations(saved)
    } else {
      loadTranslations('en')
    }
  }, [loadTranslations])

  const setLocale = useCallback((lang: Locale) => {
    setLocaleState(lang)
    localStorage.setItem('locale', lang)
    loadTranslations(lang)
  }, [loadTranslations])

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let value = translations[key] || key
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, String(v))
      })
    }
    return value
  }, [translations])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, ready }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()
  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')}
      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
      type="button"
    >
      <span className="text-base">{locale === 'en' ? '🇨🇳' : '🇬🇧'}</span>
      {locale === 'en' ? '中文' : 'English'}
    </button>
  )
}
