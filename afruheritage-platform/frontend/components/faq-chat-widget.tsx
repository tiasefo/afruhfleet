'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  MessageSquare,
  X,
  Send,
  Minus,
  Maximize2,
  Minimize2,
  Bot,
  User,
  Sparkles,
  HelpCircle,
  ArrowRight,
  GripHorizontal,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { findBestFAQ, WELCOME_MESSAGE, SUPPORT_REDIRECT_MESSAGE } from '@/components/faq-knowledge'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isSupportRedirect?: boolean
  isUpgradePrompt?: boolean
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

export function FAQChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [config, setConfig] = useState<WidgetConfig | null>(null)
  const [configError, setConfigError] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Drag state
  const [pos, setPos] = useState({ right: 24, bottom: 24 })
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startRight: 0, startBottom: 0 })

  // Fetch widget config on mount
  useEffect(() => {
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost'
    fetch(`/api/v1/ai/widget/config?host=${host}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load config')
        return res.json()
      })
      .then((data: WidgetConfig) => {
        setConfig(data)
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: data.welcome_message || WELCOME_MESSAGE,
            timestamp: new Date(),
          },
        ])
      })
      .catch(() => {
        setConfigError(true)
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: WELCOME_MESSAGE,
            timestamp: new Date(),
          },
        ])
      })
  }, [])

  // Track whether user is near bottom for smart auto-scroll
  const [userScrolledUp, setUserScrolledUp] = useState(false)

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return
    const container = messagesContainerRef.current
    const threshold = 100 // pixels from bottom
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    setUserScrolledUp(!isNearBottom)
  }, [])

  // Auto-scroll to bottom only if user is near bottom
  useEffect(() => {
    if (messagesContainerRef.current && !userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, isTyping, userScrolledUp])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  // Window-level drag handlers
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current.active) return
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const dx = dragRef.current.startX - clientX
      const dy = dragRef.current.startY - clientY
      setPos({
        right: Math.max(0, Math.min(window.innerWidth - 60, dragRef.current.startRight + dx)),
        bottom: Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.startBottom + dy)),
      })
    }
    const handleEnd = () => {
      dragRef.current.active = false
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleMove, { passive: false })
    window.addEventListener('touchend', handleEnd)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [])

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX: number
    let clientY: number
    if ('touches' in e.nativeEvent && e.nativeEvent.touches.length > 0) {
      clientX = e.nativeEvent.touches[0].clientX
      clientY = e.nativeEvent.touches[0].clientY
    } else if ('clientX' in e.nativeEvent) {
      clientX = e.nativeEvent.clientX
      clientY = e.nativeEvent.clientY
    } else {
      return
    }
    dragRef.current = {
      active: true,
      startX: clientX,
      startY: clientY,
      startRight: pos.right,
      startBottom: pos.bottom,
    }
  }

  const handleAIResponse = async (userMessage: Message) => {
    if (!config || configError) {
      // Fallback to local FAQ
      setTimeout(() => {
        const match = findBestFAQ(userMessage.content)
        let assistantMessage: Message
        if (match && match.score >= 6) {
          assistantMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: match.entry.answer,
            timestamp: new Date(),
          }
        } else {
          assistantMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: SUPPORT_REDIRECT_MESSAGE,
            timestamp: new Date(),
            isSupportRedirect: true,
          }
        }
        setMessages((prev) => [...prev, assistantMessage])
        setIsTyping(false)
      }, 800)
      return
    }

    try {
      const res = await fetch(config.api_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          tenant_slug: config.tenant_slug,
          tenant_scope: config.scope,
          model: config.model,
          page_url: typeof window !== 'undefined' ? window.location.href : '',
        }),
      })

      if (!res.ok) {
        if (res.status === 403) {
          const errorData = await res.json().catch(() => null)
          const featureName = errorData?.detail?.required_feature || 'this feature'
          const upgradeMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `AI chat is not available on your current plan. Upgrade to Pro to unlock ${featureName.replace(/_/g, ' ')} and more features.`,
            timestamp: new Date(),
            isUpgradePrompt: true,
          }
          setMessages((prev) => [...prev, upgradeMessage])
          return
        }
        throw new Error('AI request failed')
      }
      const data = await res.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || 'Sorry, I could not process your request.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      // Fallback to local FAQ on API error
      const match = findBestFAQ(userMessage.content)
      let assistantMessage: Message
      if (match && match.score >= 6) {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: match.entry.answer,
          timestamp: new Date(),
        }
      } else {
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: SUPPORT_REDIRECT_MESSAGE,
          timestamp: new Date(),
          isSupportRedirect: true,
        }
      }
      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSendMessage = useCallback(() => {
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
    handleAIResponse(userMessage)
  }, [inputValue, isTyping, config, configError])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const headerColor = config?.primary_color || '#063f4f'

  return (
    <div
      style={{ right: pos.right, bottom: pos.bottom, position: 'fixed', zIndex: 50 }}
      className="flex flex-col"
    >
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          className="h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-transform cursor-grab active:cursor-grabbing"
          size="icon"
          style={{ backgroundColor: headerColor }}
        >
          <MessageSquare className="h-6 w-6" />
          <span className="sr-only">Open chat</span>
        </Button>
      ) : (
        <div
          className={cn(
            'flex flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl transition-all duration-300',
            isFullscreen
              ? 'fixed inset-4 z-[100] h-auto w-auto rounded-2xl'
              : isMinimized
                ? 'h-14 w-80'
                : isExpanded
                  ? 'h-[80vh] w-[600px]'
                  : 'h-[520px] w-96'
          )}
        >
          {/* Header - draggable (except fullscreen) */}
          <div
            onMouseDown={isFullscreen ? undefined : startDrag}
            onTouchStart={isFullscreen ? undefined : startDrag}
            className={cn(
              "flex items-center justify-between border-b px-4 py-3 select-none",
              isFullscreen ? "" : "cursor-grab active:cursor-grabbing"
            )}
            style={{ backgroundColor: headerColor }}
          >
            <div className="flex items-center gap-3">
              {!isFullscreen && <GripHorizontal className="h-4 w-4 text-white/50" />}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Help</h3>
                <p className="text-xs text-white/70">{isTyping ? 'Typing...' : 'Online'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (isFullscreen) {
                      setIsFullscreen(false)
                    } else {
                      setIsExpanded(!isExpanded)
                    }
                  }}
                  title={isFullscreen ? 'Exit Fullscreen' : isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              )}
              {!isMinimized && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsFullscreen(!isFullscreen)
                  }}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMinimized(!isMinimized)
                }}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                  setIsExpanded(false)
                  setIsFullscreen(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages — plain div with overflow-y-auto for reliable scrolling */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3',
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback
                          className={cn(
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'text-white'
                          )}
                          style={message.role !== 'user' ? { backgroundColor: headerColor } : undefined}
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
                          'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-md'
                            : 'bg-muted text-foreground rounded-tl-md'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.isSupportRedirect && (
                          <div className="mt-3">
                            <Link href="/support">
                              <Button
                                size="sm"
                                className="gap-1 text-white hover:opacity-90"
                                style={{ backgroundColor: headerColor }}
                              >
                                <HelpCircle className="h-3.5 w-3.5" />
                                Create Support Ticket
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        )}
                        {message.isUpgradePrompt && (
                          <div className="mt-3">
                            <Link href="/billing">
                              <Button
                                size="sm"
                                className="gap-1 text-white hover:opacity-90"
                                style={{ backgroundColor: headerColor }}
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                Upgrade Plan
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        )}
                        <p
                          className={cn(
                            'mt-1 text-[10px]',
                            message.role === 'user'
                              ? 'text-primary-foreground/60'
                              : 'text-muted-foreground'
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

                  {isTyping && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-white" style={{ backgroundColor: headerColor }}>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-2xl rounded-tl-md bg-muted px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Invisible anchor for auto-scroll */}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="border-t bg-background p-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a question..."
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
                  {configError ? 'Powered by local knowledge base' : 'Powered by AI'}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
