"use client"

import { useEffect, useRef, useState } from "react"
import { MessageCircle, X, Send, Headset } from "lucide-react"
import { Button } from "@/components/ui/button"
import { brand, waLink, whatsapp } from "@/lib/amooksco"

const SUGGESTIONS = [
  "How does shipping from China work?",
  "How do I track my goods?",
  "How do I pay with Mobile Money?",
]

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: "Hi! I'm Amo, your AMOOKSCO assistant. Ask me about shipping from China to Ghana, tracking, or Mobile Money payments." }
  ])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, open])

  function submit(text: string) {
    const value = text.trim()
    if (!value) return
    setMessages([...messages, { role: 'user', content: value }])
    setInput("")
    // Simulate response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: "Thank you for your message. For immediate assistance, please contact our team via WhatsApp." }])
    }, 1000)
  }

  return (
    <>
      {/* Floating circular button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Chat with us"}
        className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl ring-4 ring-accent/20 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[30rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {/* header */}
          <div className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Headset className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Chat with Amo</p>
              <p className="text-[11px] text-primary-foreground/70">{brand.name}</p>
            </div>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/40 px-4 py-4">
            {messages.length === 1 && (
              <div className="space-y-3">
                <div className="rounded-xl rounded-tl-sm bg-card px-3 py-2 text-sm text-foreground shadow-sm">
                  {messages[0].content}
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => submit(s)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:text-accent-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.slice(1).map((m, i) => {
              const isUser = m.role === "user"
              return (
                <div
                  key={i}
                  className={isUser ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      isUser
                        ? "max-w-[85%] rounded-xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                        : "max-w-[85%] rounded-xl rounded-tl-sm bg-card px-3 py-2 text-sm text-foreground shadow-sm"
                    }
                  >
                    {m.content}
                  </div>
                </div>
              )
            })}
          </div>

          {/* input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit(input)
            }}
            className="flex items-center gap-2 border-t border-border bg-card px-3 py-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message…"
              className="flex-1 rounded-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              aria-label="Message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="size-9 shrink-0 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  )
}
