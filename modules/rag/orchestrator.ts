// modules/rag/orchestrator.ts

import { retrieveDual } from "./pipeline/retriever"
import { rerank } from "./pipeline/reranker"
import { streamGroq, callGroqPro } from "./client/groq"
import { SYSTEM_PROMPT } from "./prompt"
import type { ChatMessage, HistoryMessage, RAGChunk, RAGResult } from "./types"

const FINAL_K = parseInt(process.env.FINAL_K ?? "10")

// ── Context builder ───────────────────────────────────────────────────────────

function buildContext(chunks: RAGChunk[]): string {
  return chunks
    .map((chunk, index) => {
      const source = chunk.metadata.fileName || "Unknown document"
      const position = `(chunk ${chunk.metadata.chunkIndex + 1} of ${chunk.metadata.totalChunks})`
      return `[Source ${index + 1}: ${source} ${position}]\n${chunk.content}`
    })
    .join("\n\n---\n\n")
}

function buildMessages(
  question: string,
  context: string,
  history: HistoryMessage[]
): ChatMessage[] {
  const systemMessage = SYSTEM_PROMPT.replace("{context}", context)

  return [
    { role: "system", content: systemMessage },
    // Include recent history for multi-turn conversations
    // Limit to last 10 messages to avoid context overflow
    ...history.slice(-10).map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: "user", content: question },
  ]
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

async function runPipeline(
  question: string,
  orgId: string,
  history: HistoryMessage[]
): Promise<{ messages: ChatMessage[]; chunks: RAGChunk[]; metadata: RAGResult["metadata"] }> {
  const startTime = Date.now()

  if (!orgId) {
    throw new Error("[RAG] orgId is required — pipeline cannot run without tenant context")
  }

  // Step 1: Dual retrieval (original + rewritten query)
  const { chunks: retrieved, rewrittenQuery } = await retrieveDual(
    question,
    orgId,
    history
  )

  console.log(`[RAG] Retrieved ${retrieved.length} unique chunks`)

  // Step 2: LLM reranking — orders by actual relevance, not cosine similarity
  const ranked = await rerank(question, retrieved)

  // Step 3: Take top K after reranking
  const finalChunks = ranked.slice(0, FINAL_K)

  console.log(`[RAG] Using top ${finalChunks.length} chunks for answer`)

  // Step 4: Build context string and messages
  const context = buildContext(finalChunks)
  const messages = buildMessages(question, context, history)

  return {
    messages,
    chunks: finalChunks,
    metadata: {
      originalQuery:  question,
      rewrittenQuery,
      retrievedCount: retrieved.length,
      usedChunks:     finalChunks.length,
      durationMs:     Date.now() - startTime,
    } satisfies RAGResult["metadata"],
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Run RAG pipeline and return a streaming response.
 * Used by the chat API route — gives users the typewriter effect.
 *
 * Returns both the stream and the chunks used (for source citations).
 * The chat route sends chunks as a custom header or separate response.
 */
export interface RunRAGResult {
  stream:    ReadableStream<Uint8Array>
  getUsage:  () => Promise<{ promptTokens: number; completionTokens: number }>
  modelUsed: string
  chunks:    RAGChunk[]
  metadata:  RAGResult["metadata"]
}

export async function runRAG(
  question: string,
  orgId: string,
  history: HistoryMessage[] = []
): Promise<RunRAGResult> {
  const { messages, chunks, metadata } = await runPipeline(question, orgId, history)

  console.log(`[RAG] Pipeline completed in ${metadata.durationMs}ms — streaming answer`)

  const { stream, getUsage, modelUsed } = await streamGroq(messages)

  return { stream, getUsage, modelUsed, chunks, metadata };
}

export async function runRAGSync(
  question: string,
  orgId: string,
  history: HistoryMessage[] = []
): Promise<RAGResult & { answer: string }> {
  const { messages, chunks, metadata } = await runPipeline(question, orgId, history)

  const answer = await callGroqPro(messages)

  console.log(`[RAG] Answer generated (${answer.length} chars) in ${metadata.durationMs}ms`)

  return {
    answer,
    chunks,
    metadata,
  }
}


// Master RAG pipeline orchestrator
// Runs: query rewrite → dual retrieval → rerank → stream answer
//
// Two exports:
//   runRAG()       → returns streaming ReadableStream (for chat UI)
//   runRAGSync()   → returns full answer string (for testing/non-streaming)

/**
 * runRAGSync()
 * Run RAG pipeline and return full answer string.
 * Used for testing, batch processing, or non-streaming contexts.
 */