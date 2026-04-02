// modules/rag/pinecone.ts
// Pinecone vector database client
// CRITICAL: Every upsert tags orgId in metadata.
//           Every query filters by orgId.
//           Tenant isolation is enforced at this layer — not optional.

import { Pinecone, type PineconeRecord } from "@pinecone-database/pinecone"
import { env } from "@/core/env/env.mjs"
import type { RAGChunk, ChunkForUpsert } from "../types"

// ── Client singleton ──────────────────────────────────────────────────────────

const pineconeClient = new Pinecone({
  apiKey: env.PINECONE_API_KEY,
})

function getIndex() {
  return pineconeClient.Index(env.PINECONE_INDEX)
}

// ── Upsert ────────────────────────────────────────────────────────────────────

const UPSERT_BATCH_SIZE = 100 // Pinecone limit per upsert call

/**
 * Upsert document chunks into Pinecone.
 * Every vector is tagged with orgId — enforces tenant isolation at storage level.
 * Batches automatically to respect Pinecone's 100-vector limit per call.
 */
export async function upsertChunks(chunks: ChunkForUpsert[]): Promise<void> {
  if (chunks.length === 0) return

  const index = getIndex()

  // Validate all chunks have orgId before touching Pinecone
  for (const chunk of chunks) {
    if (!chunk.metadata.orgId) {
      throw new Error(
        `[PINECONE] Attempted upsert without orgId on chunk ${chunk.id} — rejected`
      )
    }
  }

  const vectors: PineconeRecord[]= chunks.map((chunk) => ({
    id: chunk.id,
    values: chunk.embedding,
    metadata: {
      // text is stored in metadata for retrieval — Pinecone doesn't store vectors with content by default
      text: chunk.content,
      // Tenant isolation fields — always present
      orgId:       chunk.metadata.orgId,
      documentId:  chunk.metadata.documentId,
      workspaceId: chunk.metadata.workspaceId,
      fileName:    chunk.metadata.fileName,
      chunkIndex:  chunk.metadata.chunkIndex,
      totalChunks: chunk.metadata.totalChunks,
    },
  }))

  // Batch upserts
  for (let i = 0; i < vectors.length; i += UPSERT_BATCH_SIZE) {
    const batch = vectors.slice(i, i + UPSERT_BATCH_SIZE);
    await index.upsert({ records: batch });

    console.log(
      `[PINECONE] Upserted batch ${Math.floor(i / UPSERT_BATCH_SIZE) + 1}/${Math.ceil(vectors.length / UPSERT_BATCH_SIZE)}`
    )
  }
}

/**
 * Delete all vectors for a specific document.
 * Called when a document is soft-deleted or re-processed.
 */
export async function deleteDocumentChunks(
  documentId: string,
  orgId: string
): Promise<void> {
  const index = getIndex()

  try {
    await index.deleteMany({
      filter: {
        documentId: { "$eq": documentId },
        orgId: { "$eq": orgId }
      }
    });

    console.log(`[PINECONE] Successfully deleted all chunks for document ${documentId}`);
  } catch (error) {
    // Fallback for indexes that don't support list
    console.warn(
      `[PINECONE] Could not list vectors for deletion — document ${documentId}`
    )
    throw error;
    // So that Inngest knows the step failed and can automatically retry it.
  }
}

// ── Query ─────────────────────────────────────────────────────────────────────

/**
 * Query Pinecone for similar vectors.
 * MANDATORY: orgId filter is always applied — no cross-tenant results possible.
 * Returns RAGChunk[] with content and metadata reconstructed from Pinecone metadata.
 */
export async function queryChunks(
  queryVector: number[],
  orgId: string,
  topK: number
): Promise<RAGChunk[]> {
  if (!orgId) {
    throw new Error("[PINECONE] queryChunks called without orgId — rejected")
  }

  const index = getIndex()

  const results = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
    // orgId filter — this is the tenant isolation gate at the vector DB level
    // Even if middleware and layout checks are bypassed, this ensures
    // a user can never retrieve vectors from another organization
    filter: {
      orgId: { $eq: orgId },
    },
  })

  return (
    results.matches?.map((match) => ({
      id: match.id,
      score: match.score ?? 0,
      content: (match.metadata?.text as string) ?? "",
      metadata: {
        orgId:       (match.metadata?.orgId       as string) ?? "",
        documentId:  (match.metadata?.documentId  as string) ?? "",
        workspaceId: (match.metadata?.workspaceId as string) ?? "",
        fileName:    (match.metadata?.fileName    as string) ?? "",
        chunkIndex:  (match.metadata?.chunkIndex  as number) ?? 0,
        totalChunks: (match.metadata?.totalChunks as number) ?? 0,
      },
    })) ?? []
  )
}