// modules/rag/reranker.ts

import { callGroqFast } from "../client/groq"
import type { RAGChunk } from "../types"

const MAX_CHUNKS_TO_RERANK = 30 // Cap to avoid hitting context limits

export async function rerank(
  question: string,
  chunks: RAGChunk[]
): Promise<RAGChunk[]> {
  if (chunks.length === 0) return []
  if (chunks.length === 1) return chunks

  // Cap chunks sent to LLM to avoid context overflow
  const chunksToRank = chunks.slice(0, MAX_CHUNKS_TO_RERANK)
  const skipped = chunks.slice(MAX_CHUNKS_TO_RERANK)

  const systemPrompt = `You are a document relevance ranker.
You receive a question and numbered document chunks.
Your job: rank chunks from most to least relevant to the question.

Return ONLY a JSON object in this exact format:
{"order": [3, 1, 7, 2, 5, 4, 6]}

Include ALL chunk numbers. Do not explain. Do not add text outside the JSON.`

  let userPrompt = `Question: ${question}\n\nChunks to rank:\n\n`

  chunksToRank.forEach((chunk, index) => {
    // Truncate very long chunks to avoid context overflow
    const preview = chunk.content.length > 500
      ? `${chunk.content.slice(0, 500)}...`
      : chunk.content

    userPrompt += `CHUNK ${index + 1} [${chunk.metadata.fileName}]:\n${preview}\n\n`
  })

  userPrompt += `Return the JSON ranking now:`

  let order: number[] = []

  try {
    const raw = await callGroqFast(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      true // json mode
    )

    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed?.order)) {
      order = parsed.order
    } else if (Array.isArray(parsed)) {
      order = parsed
    }
  } catch {
    console.warn("[RERANKER] JSON parse failed — falling back to regex extraction")

    const raw = await callGroqFast([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ])

    // Try structured JSON first
    try {
      const jsonMatch = raw.match(/\{[\s\S]*"order"[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        order = Array.isArray(parsed.order) ? parsed.order : []
      }
    } catch {
      // Last resort: extract any numbers from the response
      const matches = raw.match(/\d+/g)
      order = matches ? matches.map(Number) : []
    }
  }

  // Validate and map indices (1-indexed in prompt → 0-indexed in array)
  const validOrder = order
    .filter((id) => Number.isInteger(id) && id >= 1 && id <= chunksToRank.length)
    // Remove duplicates while preserving order
    .filter((id, idx, arr) => arr.indexOf(id) === idx)

  // If we got a valid order, use it — otherwise fall back to original order
  const ranked = validOrder.length > 0
    ? validOrder.map((id) => chunksToRank[id - 1]).filter(Boolean)
    : chunksToRank

  // Append any chunks that weren't included in the ranking (shouldn't happen with valid LLM output, but defensive)
  const rankedIds = new Set(ranked.map((c) => c.id))
  const missing = chunksToRank.filter((c) => !rankedIds.has(c.id))

  return [...ranked, ...missing, ...skipped]
}


// LLM-based reranker — improves chunk ordering beyond cosine similarity scores
// Cosine similarity finds semantically similar text.
// Reranking finds text that actually answers the specific question.
// Uses fast model — task is ranking, not generation.

/**
 * Reranks retrieved chunks by relevance to the user's question.
 *
 * Why reranking matters:
 * - Cosine similarity: "pricing" matches all chunks mentioning pricing
 * - Reranker: understands "what is the Enterprise tier monthly cost?" and
 *   prioritizes the chunk with the actual price over marketing copy
 *
 * Uses JSON mode to ensure parseable output even with special chars in content.
 */