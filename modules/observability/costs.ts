export const AI_MODELS = {
  // ── Groq LLM models ──────────────────────────────────────────────────────
  "llama-3.3-70b-versatile": {
    input:  0.00000059, // $0.59 per 1M tokens
    output: 0.00000079, // $0.79 per 1M tokens
  },
  "llama-3.1-8b-instant": {
    input:  0.00000005, // $0.05 per 1M tokens
    output: 0.00000008, // $0.08 per 1M tokens
  },
  "gemma2-9b-it": {
    input:  0.00000020,
    output: 0.00000020,
  },
 
  // ── OpenAI embedding models ───────────────────────────────────────────────
  "text-embedding-3-small": {
    input:  0.00000002, // $0.02 per 1M tokens
    output: 0.00000002,
  },
  "text-embedding-3-large": {
    input:  0.00000013,
    output: 0.00000013,
  },
 
  // ── Open source embedding models (free via HuggingFace inference API) ────
  "BAAI/bge-m3": {
    input:  0,
    output: 0,
  },
  "sentence-transformers/all-MiniLM-L6-v2": {
    input:  0,
    output: 0,
  },
} as const
 
export type SupportedModel = keyof typeof AI_MODELS;

export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = AI_MODELS[model as SupportedModel]
  if (!pricing) return 0
 
  return (
    promptTokens     * pricing.input +
    completionTokens * pricing.output
  )
}

export function formatCost(usd: number): string {
  if (usd === 0) return "$0.00"
  if (usd < 0.0001) return `$${usd.toFixed(8)}`
  if (usd < 0.01)   return `$${usd.toFixed(6)}`
  return `$${usd.toFixed(4)}`
}

export const PLAN_TOKEN_LIMITS = {
  FREE:       100_000,
  PRO:      1_000_000,
  ENTERPRISE: 10_000_000,
} as const
 
export type Plan = keyof typeof PLAN_TOKEN_LIMITS;