// modules/rag/groq.ts
// Native Groq HTTP client — no LangChain, no SDK bloat
// Three functions: fast (rewrite/rerank), pro (final answer), stream (chat UI)

import { env } from "@/core/env/env.mjs"
import type { ChatMessage } from "../types"

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

// Models — configured via env, fallback to sensible defaults
const MODEL_FAST = process.env.GROQ_MODEL_FAST ?? "llama-3.1-8b-instant"
const MODEL_PRO  = process.env.GROQ_MODEL_PRO  ?? "llama-3.3-70b-versatile"

// ── Base caller ───────────────────────────────────────────────────────────────

async function callGroqBase(
  messages: ChatMessage[],
  model: string,
  options: {
    jsonMode?: boolean
    temperature?: number
    maxTokens?: number
  } = {}
): Promise<string> {
  const { jsonMode = false, temperature = 0, maxTokens = 2048 } = options

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode && { response_format: { type: "json_object" } }),
    }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: {} }))

    // Groq rejects valid JSON containing special chars (&, <, >) in json_mode
    // The failed_generation contains the actual valid content — recover it
    if (
      response.status === 400 &&
      errorBody?.error?.code === "json_validate_failed" &&
      errorBody?.error?.failed_generation
    ) {
      console.warn("[GROQ] JSON validation failed — recovering from failed_generation")
      return errorBody.error.failed_generation as string
    }

    throw new Error(
      `Groq API error: ${response.status} — ${JSON.stringify(errorBody)}`
    )
  }

  const data = await response.json()
  return data.choices[0]?.message?.content ?? ""
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fast model — used for query rewriting and reranking.
 * Speed matters here, not quality. 8b model is sufficient.
 */
export async function callGroqFast(
  messages: ChatMessage[],
  jsonMode = false
): Promise<string> {
  return callGroqBase(messages, MODEL_FAST, { jsonMode, maxTokens: 1024 })
}

/**
 * Pro model — used for the final answer generation.
 * Quality matters here. 70b model produces significantly better answers.
 */
export async function callGroqPro(
  messages: ChatMessage[],
  maxTokens = 2048
): Promise<string> {
  return callGroqBase(messages, MODEL_PRO, { maxTokens })
}

/**
 * Streaming pro model — used for the chat API route.
 * Returns a ReadableStream of Server-Sent Events.
 * Compatible with Vercel AI SDK's useChat hook.
 */

export interface StreamGroqResult {
  stream:    ReadableStream<Uint8Array>
  getUsage:  () => Promise<{ promptTokens: number; completionTokens: number }>
  modelUsed: string
}

export async function streamGroq(
  messages: ChatMessage[],
  maxTokens = 2048
): Promise<StreamGroqResult> {
  // Deferred promise — resolves when usage data arrives in SSE stream
  let resolveUsage!: (usage: { promptTokens: number; completionTokens: number }) => void;
  let rejectUsage!: (error: Error) => void;

  const usagePromise = new Promise<{ promptTokens: number; completionTokens: number }>((resolve, reject) => {
    resolveUsage = resolve;
    rejectUsage = reject;
  });

  // Set a fallback timeout — if Groq never sends usage data, resolve with zeros (Prevents getUsage() from hanging indefinitely)
  const usageTimeout = setTimeout(() => {
    resolveUsage({ promptTokens: 0, completionTokens: 0 })
  }, 30_000)  

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL_PRO,
      messages,
      temperature: 0,
      max_tokens: maxTokens,
      stream: true,
      stream_options: { include_usage: true},
    }),
  })

  if (!response.ok) {
    clearTimeout(usageTimeout)
    const error = await response.text()
    rejectUsage(new Error(`Groq streaming error: ${response.status} — ${error}`))
    throw new Error(`Groq streaming error: ${response.status} — ${error}`)
  }

  if (!response.body) {
    clearTimeout(usageTimeout)
    rejectUsage(new Error("Groq returned no response body"))
    throw new Error("Groq returned no response body for streaming request")
  }

  // Transform Groq's SSE stream into a plain text stream
  // Each chunk: "data: {...}\n\n" → extract delta content → encode as UTF-8
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true })
      const lines = text.split("\n").filter((line) => line.startsWith("data: "))

      for (const line of lines) {
        const data = line.slice(6).trim()

        if (data === "[DONE]") {
          clearTimeout(usageTimeout)
          resolveUsage({ promptTokens: 0, completionTokens: 0 })
          return
        }

        try {
          const parsed = JSON.parse(data)

          // Extract usage from final chunk (Groq sends usage before [DONE])
          if (parsed.usage) {
            clearTimeout(usageTimeout)
            resolveUsage({
              promptTokens:     parsed.usage.prompt_tokens     ?? 0,
              completionTokens: parsed.usage.completion_tokens ?? 0,
            })
          }

          // Extract and forward text delta to client
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) {
            controller.enqueue(encoder.encode(delta))
          }
        } catch {
          // Malformed SSE chunk — skip silently
        }
      }
    },
    flush() {
      // Stream ended — ensure usage promise is resolved
      clearTimeout(usageTimeout)
      resolveUsage({ promptTokens: 0, completionTokens: 0 })
    },
  })

  return {
    stream: response.body.pipeThrough(transformStream),
    getUsage: () => usagePromise,
    modelUsed: MODEL_PRO,
  }
}