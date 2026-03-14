import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2, Sparkles } from 'lucide-react'
import { chatbotApi } from '../../lib/api/chatbot'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const QUICK_PROMPTS = [
  'How do I get started with React?',
  'Explain async/await in JavaScript',
  'What is a REST API?',
  'Help me understand TypeScript generics',
]

export function GlobalChatbot() {
  const { isAuthenticated } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm CodeMentor AI 👋 I'm here to help you learn, answer coding questions, and guide your learning journey. What can I help you with today?",
      timestamp: new Date(),
    },
  ])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && !isMinimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isMinimized])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, isMinimized])

  if (!isAuthenticated()) return null

  const sendMessage = async (text?: string) => {
    const messageText = text ?? input.trim()
    if (!messageText || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await chatbotApi.chat(messageText)
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.reply,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      toast.error('Chatbot is unavailable right now')
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: isMinimized ? 0.95 : 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-[380px] bg-surface-2 border border-white/10 rounded-3xl shadow-2xl shadow-brand-primary/10 overflow-hidden flex flex-col"
            style={{ height: isMinimized ? '60px' : '560px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/10 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-display font-bold text-sm text-white">CodeMentor AI</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-pulse" />
                    <span className="text-[10px] text-brand-secondary font-medium">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(m => !m)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        msg.role === 'assistant'
                          ? 'bg-gradient-to-br from-brand-primary to-brand-secondary'
                          : 'bg-surface-3 border border-white/10'
                      }`}>
                        {msg.role === 'assistant'
                          ? <Bot className="w-3.5 h-3.5 text-white" />
                          : <User className="w-3.5 h-3.5 text-text-muted" />
                        }
                      </div>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'assistant'
                          ? 'bg-surface-3 text-text-primary border border-white/5 rounded-tl-sm'
                          : 'bg-brand-primary text-white rounded-tr-sm'
                      }`}>
                        {msg.content.split('\n').map((line, i) => (
                          <span key={i}>{line}{i < msg.content.split('\n').length - 1 && <br />}</span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="bg-surface-3 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1.5 items-center h-4">
                          <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Quick Prompts (only when no user messages yet) */}
                {messages.length === 1 && (
                  <div className="px-4 pb-3">
                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mb-2">Quick Questions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PROMPTS.map(p => (
                        <button
                          key={p}
                          onClick={() => sendMessage(p)}
                          className="text-xs px-3 py-1.5 bg-white/5 border border-white/5 rounded-full hover:bg-brand-primary/20 hover:border-brand-primary/30 transition-all text-text-muted hover:text-brand-primary"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="px-4 pb-4 shrink-0">
                  <div className="flex gap-2 bg-surface-3 border border-white/5 rounded-2xl p-2 focus-within:border-brand-primary/50 transition-colors">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask anything..."
                      className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none px-2"
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || isLoading}
                      className="w-8 h-8 rounded-xl bg-brand-primary flex items-center justify-center hover:shadow-[0_0_12px_rgba(108,59,255,0.5)] transition-all disabled:opacity-40 shrink-0"
                    >
                      {isLoading
                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                        : <Send className="w-4 h-4 text-white" />
                      }
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setIsOpen(o => !o); setIsMinimized(false) }}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary shadow-[0_0_20px_rgba(108,59,255,0.4)] flex items-center justify-center relative"
      >
        <AnimatePresence mode="wait">
          {isOpen
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="w-6 h-6 text-white" />
              </motion.div>
            : <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <MessageCircle className="w-6 h-6 text-white" />
              </motion.div>
          }
        </AnimatePresence>
        {/* Pulse ring */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-2xl border-2 border-brand-primary/50 animate-ping" />
        )}
      </motion.button>
    </div>
  )
}
