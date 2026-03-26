// modules/rag/rewrite.ts

import { callGroqFast } from "../client/groq"
import type { ChatMessage, HistoryMessage } from "../types"

export async function rewriteQuery(
  question: string,
  history: HistoryMessage[] = []
): Promise<string> {
  // If no history, the question is self-contained — minimal rewrite needed
  if (history.length === 0) {
    return rewriteStandalone(question)
  }

  return rewriteWithContext(question, history)
}

// ── Private helpers ───────────────────────────────────────────────────────────

async function rewriteStandalone(question: string): Promise<string> {
  const prompt = `You are a search query optimizer for a document knowledge base.
Convert the user's question into the most precise search query possible.
The query should surface the most relevant document excerpts.
Keep it short (under 15 words). Focus on key nouns and concepts.

User question: ${question}

Respond ONLY with the optimized search query. Nothing else.`

  const rewritten = await callGroqFast([
    { role: "user", content: prompt },
  ])

  return rewritten.trim() || question // fallback to original if rewrite fails
}

async function rewriteWithContext(
  question: string,
  history: HistoryMessage[]
): Promise<string> {
  // Build history text — last 6 messages max to stay within context limits
  const recentHistory = history.slice(-6)
  const historyText = recentHistory
    .map((h) => `${h.role.toUpperCase()}: ${h.content}`)
    .join("\n")

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a search query optimizer for a document knowledge base.
You are given a conversation history and the user's latest question.
Your job is to produce a single, precise search query that will find the most relevant documents.

Rules:
- Resolve pronouns using conversation context ("their" → company name, "it" → product name)
- Include key terms from earlier in the conversation if they are still relevant
- Keep the query short (under 15 words)
- Focus on nouns and specific concepts, not question words (who/what/when/how)
- Respond ONLY with the search query text — nothing else`,
    },
    {
      role: "user",
      content: `Conversation history:\n${historyText}\n\nCurrent question: ${question}\n\nSearch query:`,
    },
  ]

  const rewritten = await callGroqFast(messages)
  return rewritten.trim() || question
}

// Rewrites the user's question into an optimized knowledge base search query
// Uses the fast model — speed matters here, not quality
// Handles conversational context (follow-up questions, pronouns, references)

/**
 * Rewrites a user question into a precise knowledge base search query.
 *
 * Why this matters:
 * - User asks: "What about their pricing?" (pronoun "their" is ambiguous)
 * - Rewritten: "Acme Inc product pricing tiers" (specific, searchable)
 *
 * Dual retrieval uses BOTH the original and rewritten query.
 * The rewrite captures intent the original phrasing might miss.
 */