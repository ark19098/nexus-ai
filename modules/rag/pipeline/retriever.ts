// modules/rag/retriever.ts

import { embedQuery } from "../client/embeddings"
import { queryChunks } from "../client/pinecone"
import { rewriteQuery } from "./rewrite"
import type { RAGChunk, HistoryMessage } from "../types"

const RETRIEVAL_K = parseInt(process.env.RETRIEVAL_K ?? "20")

export interface DualRetrievalResult {
  chunks: RAGChunk[]
  rewrittenQuery: string
}

export async function retrieveDual(
  question: string,
  orgId: string,
  history: HistoryMessage[] = []
): Promise<DualRetrievalResult> {
  if (!orgId) {
    throw new Error("[RETRIEVER] orgId is required — cannot retrieve without tenant context")
  }

  // Step 1: Rewrite query using conversation history
  const rewrittenQuery = await rewriteQuery(question, history)

  console.log(`[RETRIEVER] Original: "${question}"`)
  console.log(`[RETRIEVER] Rewritten: "${rewrittenQuery}"`)

  // Step 2: Embed both queries in parallel — saves ~1 second vs sequential
  const [originalVector, rewrittenVector] = await Promise.all([
    embedQuery(question),
    embedQuery(rewrittenQuery),
  ])

  // Step 3: Query Pinecone with both vectors in parallel
  // Both queries filter by orgId — cross-tenant retrieval is impossible
  const [originalChunks, rewrittenChunks] = await Promise.all([
    queryChunks(originalVector, orgId, RETRIEVAL_K),
    queryChunks(rewrittenVector, orgId, RETRIEVAL_K),
  ])

  console.log(
    `[RETRIEVER] Original: ${originalChunks.length} chunks | Rewritten: ${rewrittenChunks.length} chunks`
  )

  // Step 4: Merge and deduplicate by chunk ID
  const merged = mergeUnique(originalChunks, rewrittenChunks)

  console.log(`[RETRIEVER] Merged unique: ${merged.length} chunks`)

  return {
    chunks: merged,
    rewrittenQuery,
  }
}

function mergeUnique(chunks1: RAGChunk[], chunks2: RAGChunk[]): RAGChunk[] {
  const seen = new Set<string>()
  const merged: RAGChunk[] = []

  for (const chunk of [...chunks1, ...chunks2]) {
    if (!seen.has(chunk.id)) {
      seen.add(chunk.id)
      merged.push(chunk)
    }
  }

  return merged
}


// Dual retrieval — queries Pinecone with BOTH the original and rewritten query
// Merges results by chunk ID to eliminate duplicates
//
// Why dual retrieval:
// - Original query captures user intent exactly as phrased
// - Rewritten query captures intent optimized for retrieval
// - Together they catch relevant chunks either alone would miss
//
// TENANT ISOLATION: orgId is passed to every Pinecone query.
// A user can ONLY retrieve their own organization's chunks.

/**
 * Dual retrieval with tenant isolation.
 * Embeds both the original and rewritten query, queries Pinecone twice,
 * merges unique results by chunk ID.
 *
 * @param question   The user's original question
 * @param orgId      The organization ID — mandatory for tenant isolation
 * @param history    Conversation history for context-aware query rewriting
 */

/**
 * mergeUnique()
 * Merges two chunk arrays, deduplicating by chunk ID.
 * Original query chunks come first — they typically have higher relevance scores.
 * Rewritten query chunks that aren't duplicates are appended.
 *
 * Uses Set for O(n) deduplication instead of O(n²) nested loop.
 */