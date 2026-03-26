// modules/rag/types.ts

// Vector chunk returned from Pinecone
export interface RAGChunk {
  id: string
  content: string
  score?: number // cosine similarity score from Pinecone
  metadata: {
    orgId: string        // tenant isolation — always present
    documentId: string   // links back to PostgreSQL Document record
    workspaceId: string  // workspace scoping
    fileName: string     // original file name for citations
    chunkIndex: number   // position in original document
    totalChunks: number  // total chunks for this document
    [key: string]: unknown
  }
}

// Result returned from runRAG()
export interface RAGResult {
  chunks: RAGChunk[]     // final chunks used to generate answer
  metadata: {
    originalQuery: string
    rewrittenQuery: string
    retrievedCount: number  // total unique chunks before reranking
    usedChunks: number      // chunks after reranking slice
    durationMs: number      // total pipeline duration
  }
}

// Chat history message
export interface HistoryMessage {
  role: "user" | "assistant"
  content: string
}

// Groq message format
export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

// Input to the vectorization job
export interface VectorizationInput {
  documentId: string
  orgId: string
  workspaceId: string
  fileKey: string   // R2 object key
  fileName: string  // original file name
}

// Single chunk ready for upsert to Pinecone
export interface ChunkForUpsert {
  id: string
  content: string
  embedding: number[]
  metadata: RAGChunk["metadata"]
}