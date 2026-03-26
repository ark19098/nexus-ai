"use client"

// modules/ai/components/Chat.tsx
// Final production chat UI — dark theme, streaming, RAG diagnostics, source citations

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Send, Square } from "lucide-react"

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import MessageBubble from "./MessageBubble"
import EmptyState from "./EmptyState"
import { Message, RAGMetadata } from "../types"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ChatProps {
  conversationId?: string
  initialMessages?: Message[]
  orgId: string
  wsId: string
  userName?: string
}

export default function Chat({
  conversationId,
  initialMessages = [],
  orgId,
  wsId,
  userName = "You",
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Cleanup on unmount
  useEffect(() => {
    return () => abortControllerRef.current?.abort()
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [input])

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userQuestion = input.trim()
    setInput("")
    setIsLoading(true)

    // Optimistic UI — add user message + assistant placeholder immediately
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userQuestion,
    }

    const assistantMessageId = crypto.randomUUID()
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      isStreaming: true,
    }

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder])

    // Build history from current messages (exclude placeholder)
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQuestion,
          conversationId,
          history,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errText = await response.text().catch(() => "Unknown error")
        throw new Error(errText)
      }

      // Parse RAG headers BEFORE reading stream
      // This makes sources visible while the AI is still typing
      const metadata: RAGMetadata = {
        sources: (() => {
          try {
            const rawSources = response.headers.get("X-RAG-Sources")
            if (!rawSources) return []
            return rawSources ? JSON.parse(decodeURIComponent(rawSources)) : [];
        }
          catch { return [] }
        })(),
        retrieved: parseInt(response.headers.get("X-RAG-Retrieved") ?? "0", 10),
        used:      parseInt(response.headers.get("X-RAG-Used")      ?? "0", 10),
        durationMs: parseInt(response.headers.get("X-RAG-Duration-Ms") ?? "0", 10),
        rewrittenQuery: (() => {
          try { return decodeURIComponent(response.headers.get("X-RAG-Rewritten-Query") ?? "") }
          catch { return "" }
        })(),
      }

      // Attach metadata to placeholder — sources appear while streaming
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId ? { ...msg, metadata } : msg
        )
      )

      // Read stream
      const reader = response.body?.getReader()
      if (!reader) throw new Error("No readable stream")

      const decoder = new TextDecoder()
      let streamedText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        streamedText += decoder.decode(value, { stream: true })

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: streamedText }
              : msg
          )
        )
      }

      // Finalize — remove streaming flag
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      )
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return

      console.error("[CHAT]", error)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: "Something went wrong. Please try again.",
                isError: true,
                isStreaming: false,
              }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }

  const stopGeneration = () => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {messages.length === 0 && <EmptyState />}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              userName={userName}
            />
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input ── */}
      <div className="border-t border-zinc-800 px-4 pb-4 pt-3">
        <div className="max-w-3xl mx-auto">
          <div className={cn(
            "flex items-end gap-3 bg-zinc-900 border rounded-xl px-4 py-3 transition-colors",
            isLoading ? "border-zinc-700" : "border-zinc-700 focus-within:border-cyan-700"
          )}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={false}
              placeholder="Ask a question about your documents..."
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-zinc-600 text-sm resize-none outline-none min-h-[24px] max-h-[160px]"
            />

            {isLoading ? (
              <button
                onClick={stopGeneration}
                className="flex-shrink-0 w-8 h-8 bg-red-950 hover:bg-red-900 border border-red-800 rounded-lg flex items-center justify-center transition-colors"
                title="Stop generating"
              >
                <Square className="w-3 h-3 text-red-400 fill-red-400" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmit()}
                disabled={!input.trim()}
                className="flex-shrink-0 w-8 h-8 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-colors"
                title="Send (Enter)"
              >
                <Send className="w-3.5 h-3.5 text-zinc-950" />
              </button>
            )}
          </div>

          <p className="text-zinc-700 text-xs text-center mt-2">
            Enter to send · Shift+Enter for new line · Answers sourced from your documents only
          </p>
        </div>
      </div>
    </div>
  )
}
