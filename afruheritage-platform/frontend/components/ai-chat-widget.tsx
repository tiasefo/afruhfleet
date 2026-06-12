'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  MessageSquare, 
  X, 
  Send, 
  Minus,
  Bot,
  User,
  Sparkles,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface WidgetConfig {
  enabled: boolean
  tenant_slug: string | null
  model: string
  scope: string
  welcome_message: string
  theme: string
  primary_color: string
  api_endpoint: string
}

interface AIChatResponse {
  answer: string
  sources: Array<{
    source_path?: string
  }>
}

const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  enabled: true,
  tenant_slug: null,
  model: 'afruheritage-copilot:latest',
  scope: 'shared',
  welcome_message: 'Welcome to Afruheritage Assistant. How can I help you today?',
  theme: 'light',
  primary_color: '#0ea5e9',
  api_endpoint: '/api/v1/ai/chat/public',
}

function createWelcomeMessage(content: string): Message {
  return {
    id: 'welcome',
    role: 'assistant',
    content,
    timestamp: new Date(),
  }
}

function joinApiUrl(apiBaseUrl: string, endpoint: string): string {
  const normalizedBase = apiBaseUrl.replace(/\/$/, '')
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  if (normalizedBase.endsWith('/api/v1') && normalizedEndpoint.startsWith('/api/v1/')) {
    return `${normalizedBase}${normalizedEndpoint.slice('/api/v1'.length)}`
  }

  return `${normalizedBase}${normalizedEndpoint}`
}

export function AIChatWidget() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([createWelcomeMessage(DEFAULT_WIDGET_CONFIG.welcome_message)])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>(DEFAULT_WIDGET_CONFIG)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages, isTyping])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  useEffect(() => {
    let cancelled = false

    const loadWidgetConfig = async () => {
      if (!apiBaseUrl) {
        setError('AI service is not configured for this environment.')
        return
      }

      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
        const configUrl = joinApiUrl(apiBaseUrl, `/ai/widget/config?host=${encodeURIComponent(host)}`)
        const response = await fetch(configUrl, { cache: 'no-store' })
        const data = (await response.json()) as WidgetConfig

        if (!response.ok) {
          throw new Error('Failed to load AI widget settings')
        }

        if (!cancelled) {
          setWidgetConfig(data)
          setMessages([createWelcomeMessage(data.welcome_message || DEFAULT_WIDGET_CONFIG.welcome_message)])
          setError(null)
        }
      } catch {
        if (!cancelled) {
          setWidgetConfig(DEFAULT_WIDGET_CONFIG)
          setMessages([createWelcomeMessage(DEFAULT_WIDGET_CONFIG.welcome_message)])
          setError('AI settings could not be loaded. Using default mode.')
        }
      }
    }

    loadWidgetConfig()

    return () => {
      cancelled = true
    }
  }, [apiBaseUrl])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)
    setError(null)

    try {
      if (!apiBaseUrl) {
        throw new Error('Missing API base URL')
      }

      const chatEndpoint = widgetConfig.api_endpoint || '/api/v1/ai/chat'
      const chatUrl = joinApiUrl(apiBaseUrl, chatEndpoint)
      const recentContext = messages.slice(-4).map((message) => ({
        role: message.role,
        content: message.content,
      }))
      const payload = {
        message: userMessage.content,
        tenant_scope: widgetConfig.scope,
        tenant_slug: widgetConfig.tenant_slug,
        model: widgetConfig.model,
        page_url: typeof window !== 'undefined' ? window.location.href : undefined,
        context: {
          recent_messages: recentContext,
        },
      }

      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('auth_token')
            ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            : {}),
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as AIChatResponse & { detail?: string }
      if (!response.ok || !data.answer) {
        throw new Error(data.detail || 'AI response failed')
      }

      const sourcePaths = Array.isArray(data.sources)
        ? data.sources.map((source) => source.source_path || 'knowledge').filter(Boolean)
        : []
      const appSources = sourcePaths.filter((path) => !path.startsWith('knowledge/shared/'))
      const sourcePreview = (appSources.length > 0 ? appSources : sourcePaths).slice(0, 2)
      const sourceHint = sourcePreview.length > 0
        ? `\n\nSources: ${sourcePreview.join(', ')}`
        : ''

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${data.answer}${sourceHint}`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I could not reach the AI service right now. Please try again in a moment or ask a narrower platform question.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      const detail = err instanceof Error ? err.message : 'Live AI is temporarily unavailable.'
      setError(detail)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) {
    if (!widgetConfig.enabled) {
      return null
    }

    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
        <span className="sr-only">Open chat</span>
        {/* Notification Badge */}
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
          1
        </span>
      </Button>
    )
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl transition-all duration-300",
        isMinimized ? "h-14 w-80" : "h-[520px] w-96"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-primary px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary-foreground">
              Afruheritage AI
            </h3>
            <p className="text-xs text-primary-foreground/70">
              {isTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback
                      className={cn(
                        message.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent/20 text-accent-foreground"
                      )}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground rounded-tr-md"
                        : "bg-muted text-foreground rounded-tl-md"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={cn(
                        "mt-1 text-[10px]",
                        message.role === 'user'
                          ? "text-primary-foreground/60"
                          : "text-muted-foreground"
                      )}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-accent/20 text-accent-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="rounded-2xl rounded-tl-md bg-muted px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t bg-background p-4">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              {error || 'AI responses are generated from platform knowledge via live backend.'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
