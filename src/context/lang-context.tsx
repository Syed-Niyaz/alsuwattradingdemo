'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Lang = 'en' | 'ar'

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
  isRtl: boolean
}

const translations: Record<string, Record<Lang, string>> = {
  // Sidebar
  'nav.dashboard':     { en: 'Dashboard',      ar: 'الرئيسية' },
  'nav.customers':     { en: 'Customers',       ar: 'العملاء' },
  'nav.products':      { en: 'Products',        ar: 'المنتجات' },
  'nav.newQuotation':  { en: 'New Quotation',   ar: 'عرض سعر جديد' },
  'nav.myQuotations':  { en: 'Quotations',      ar: 'عروض الأسعار' },
  'nav.mainMenu':      { en: 'Main Menu',       ar: 'القائمة الرئيسية' },
  'nav.signOut':       { en: 'Sign out',        ar: 'تسجيل الخروج' },
  'Users':             { en: 'Users',           ar: 'المستخدمون' },
  'Settings':          { en: 'Settings',        ar: 'الإعدادات' },
  // Header
  'header.salesManager': { en: 'Sales Manager', ar: 'مدير المبيعات' },
  'header.salesperson':  { en: 'Salesperson',   ar: 'مندوب مبيعات' },
}

// Read lang synchronously from localStorage — runs BEFORE first render on client
function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem('lang') as Lang) || 'en'
}

function applyDir(lang: Lang) {
  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
}

const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
  isRtl: false,
})

export function LangProvider({ children }: { children: ReactNode }) {
  // Lazy initializer — reads localStorage once synchronously on mount
  const [lang, setLangState] = useState<Lang>(getInitialLang)

  // Apply dir to <html> on mount and whenever lang changes
  useEffect(() => {
    applyDir(lang)
  }, [lang])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('lang', l)
    applyDir(l)
  }

  const t = (key: string) => translations[key]?.[lang] ?? key

  return (
    <LangContext.Provider value={{ lang, setLang, t, isRtl: lang === 'ar' }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
