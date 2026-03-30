type SourceChunk = {
  id: string
  fileName: string
  chunkIndex: number
  content: string
}

export type RAGMetadata = {
  sources: SourceChunk[]
  retrieved: number
  used: number
  durationMs: number
  rewrittenQuery: string
}

export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  metadata?: RAGMetadata
  isStreaming?: boolean
  isError?: boolean
}

export type ConversationSummary = {
  id: string
  title: string | null
  createdAt: Date
  messages: { content: string }[]
}