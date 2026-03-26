// modules/rag/embeddings.ts
// Provider abstraction — switch between HuggingFace and OpenAI via env var
// EMBEDDING_PROVIDER=huggingface → all-MiniLM-L6-v2 (384 dims) — development
// EMBEDDING_PROVIDER=openai      → text-embedding-3-small (1536 dims) — production
//
// IMPORTANT: Pinecone index dimensions must match the active provider.
// Create two indexes:
//   nexus-docs-dev:  384 dims  (HuggingFace)
//   nexus-docs-prod: 1536 dims (OpenAI)

import { env } from "@/core/env/env.mjs"
import { InferenceClient } from "@huggingface/inference"

// ── Constants ─────────────────────────────────────────────────────────────────

const PROVIDER = (process.env.EMBEDDING_PROVIDER ?? "huggingface") as
  | "huggingface"
  | "openai"

const HF_MODEL    = process.env.HF_EMBEDDING_MODEL    ?? "sentence-transformers/all-MiniLM-L6-v2"
const OPENAI_MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small"
const HF_BATCH_SIZE = 10  // HuggingFace free tier handles 10 at a time safely

// ── HuggingFace implementation ────────────────────────────────────────────────

const hfClient = new InferenceClient(env.HUGGINGFACEHUB_API_KEY)

function normalizeHFResponse(response: unknown): number[] {
  if (Array.isArray(response)) {
    if (typeof response[0] === "number") return response as number[]
    if (Array.isArray(response[0])) return response[0] as number[]
  }
  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response
  ) {
    const data = (response as { data: unknown }).data
    if (Array.isArray(data)) {
      if (typeof data[0] === "number") return data as number[]
      if (Array.isArray(data[0])) return data[0] as number[]
    }
  }
  throw new Error(`Unexpected HF embedding format: ${JSON.stringify(response).slice(0, 200)}`)
}

async function embedSingleHF(text: string): Promise<number[]> {
  const response = await hfClient.featureExtraction({
    model: HF_MODEL,
    inputs: text,
    provider: "hf-inference",
  })
  return normalizeHFResponse(response)
}

async function embedBatchHF(texts: string[]): Promise<number[][]> {
  const allEmbeddings: number[][] = []

  for (let i = 0; i < texts.length; i += HF_BATCH_SIZE) {
    const batch = texts.slice(i, i + HF_BATCH_SIZE)

    const response = await hfClient.featureExtraction({
      model: HF_MODEL,
      inputs: batch,
      provider: "hf-inference",
    })

    // Batch response is always number[][]
    if (Array.isArray(response) && Array.isArray(response[0])) {
      allEmbeddings.push(...(response as number[][]))
    } else if (Array.isArray(response) && typeof response[0] === "number") {
      // Single item returned as flat array
      allEmbeddings.push(response as number[])
    } else {
      throw new Error(`Unexpected HF batch response format`)
    }
  }

  return allEmbeddings
}

// ── OpenAI implementation ─────────────────────────────────────────────────────

const OPENAI_BATCH_SIZE = 100 // OpenAI handles large batches efficiently

async function embedSingleOpenAI(text: string): Promise<number[]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: text,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI embedding error: ${response.status} — ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding as number[]
}

async function embedBatchOpenAI(texts: string[]): Promise<number[][]> {
  const allEmbeddings: number[][] = []

  for (let i = 0; i < texts.length; i += OPENAI_BATCH_SIZE) {
    const batch = texts.slice(i, i + OPENAI_BATCH_SIZE)

    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: batch,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI embedding batch error: ${response.status} — ${error}`)
    }

    const data = await response.json()
    // OpenAI returns embeddings in order, sorted by index
    const sorted = (data.data as { index: number; embedding: number[] }[])
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding)

    allEmbeddings.push(...sorted)
  }

  return allEmbeddings
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Embed a single query string into a dense vector.
 * Used at query time — one embedding per user question.
 */
export async function embedQuery(text: string): Promise<number[]> {
  if (PROVIDER === "openai") {
    return embedSingleOpenAI(text)
  }
  return embedSingleHF(text)
}

/**
 * Embed many texts — used during document ingestion.
 * Automatically batches to respect API limits.
 * Returns embeddings in the same order as input texts.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const embeddings =
    PROVIDER === "openai"
      ? await embedBatchOpenAI(texts)
      : await embedBatchHF(texts)

  if (embeddings.length !== texts.length) {
    throw new Error(
      `Embedding count mismatch: expected ${texts.length}, got ${embeddings.length}`
    )
  }

  return embeddings
}

export { PROVIDER as EMBEDDING_PROVIDER }