'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Language = 'en' | 'zh'

interface TranslationContextType {
  t: (key: string, fallback?: string) => string
  lang: Language
  setLang: (lang: Language) => void
  isLoading: boolean
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

// Default translations (fallbacks)
const defaultTranslations = {
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.amount': 'Amount',
    
    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.invalid_credentials': 'Invalid email or password',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.shipments': 'Shipments',
    'nav.members': 'Members',
    'nav.billing': 'Billing',
    'nav.settings': 'Settings',
    'nav.support': 'Support',
    
    // Shipments
    'shipments.title': 'Shipments',
    'shipments.create': 'Create Shipment',
    'shipments.tracking_number': 'Tracking Number',
    'shipments.sender_name': 'Sender Name',
    'shipments.receiver_name': 'Receiver Name',
    'shipments.status': 'Status',
    'shipments.payment_status': 'Payment Status',
    'shipments.total_cost': 'Total Cost',
    'shipments.balance_due': 'Balance Due',
    'shipments.shipped_date': 'Shipped Date',
    'shipments.eta': 'ETA',
    'shipments.no_shipments': 'No shipments found',
    'shipments.create_first': 'Create your first shipment',
    
    // Billing
    'billing.title': 'Billing',
    'billing.subscription': 'Subscription',
    'billing.wallet_balance': 'Wallet Balance',
    'billing.add_funds': 'Add Funds',
    'billing.payment_history': 'Payment History',
    'billing.current_plan': 'Current Plan',
    'billing.upgrade': 'Upgrade',
  },
  zh: {
    // Common
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.view': '查看',
    'common.search': '搜索',
    'common.filter': '筛选',
    'common.actions': '操作',
    'common.status': '状态',
    'common.date': '日期',
    'common.amount': '金额',
    
    // Auth
    'auth.login': '登录',
    'auth.logout': '退出',
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.invalid_credentials': '邮箱或密码无效',
    
    // Navigation
    'nav.dashboard': '仪表板',
    'nav.shipments': '货物',
    'nav.members': '成员',
    'nav.billing': '账单',
    'nav.settings': '设置',
    'nav.support': '支持',
    
    // Shipments
    'shipments.title': '货物',
    'shipments.create': '创建货物',
    'shipments.tracking_number': '跟踪号码',
    'shipments.sender_name': '发件人姓名',
    'shipments.receiver_name': '收件人姓名',
    'shipments.status': '状态',
    'shipments.payment_status': '支付状态',
    'shipments.total_cost': '总成本',
    'shipments.balance_due': '余额',
    'shipments.shipped_date': '发货日期',
    'shipments.eta': '预计到达',
    'shipments.no_shipments': '未找到货物',
    'shipments.create_first': '创建您的第一个货物',
    
    // Billing
    'billing.title': '账单',
    'billing.subscription': '订阅',
    'billing.wallet_balance': '钱包余额',
    'billing.add_funds': '添加资金',
    'billing.payment_history': '支付历史',
    'billing.current_plan': '当前计划',
    'billing.upgrade': '升级',
  },
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en')
  const [translations, setTranslations] = useState(defaultTranslations.en)
  const [isLoading, setIsLoading] = useState(false)

  // Load saved language preference
  useEffect(() => {
    const savedLang = (typeof window !== 'undefined' 
      ? localStorage.getItem('language') 
      : null) as Language
    
    if (savedLang && ['en', 'zh'].includes(savedLang)) {
      setLangState(savedLang)
      setTranslations(defaultTranslations[savedLang as 'en' | 'zh'])
    }
  }, [])

  // Load translations from API
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true)
      try {
        const api = (await import('@/lib/api')).api
        const response = await api.get(`/i18n/translations/${lang}`)
        if (response.translations) {
          setTranslations({ ...defaultTranslations[lang as 'en' | 'zh'], ...response.translations })
        }
      } catch (error) {
        // Fallback to default translations
        setTranslations(defaultTranslations[lang as 'en' | 'zh'])
      } finally {
        setIsLoading(false)
      }
    }

    loadTranslations()
  }, [lang])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('language', newLang)
  }

  const t = (key: string, fallback?: string): string => {
    const value = (translations as Record<string, string>)[key]
    return value || fallback || key
  }

  const value: TranslationContextType = {
    t,
    lang,
    setLang,
    isLoading,
  }

  return React.createElement(
    TranslationContext.Provider,
    { value },
    children
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}
