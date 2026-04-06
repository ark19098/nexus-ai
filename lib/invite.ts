
import crypto from "crypto"

export function generateInviteToken(): {
  rawToken:  string
  tokenHash: string
} {
  const rawToken  = crypto.randomBytes(32).toString("hex")
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
  return { rawToken, tokenHash }
}

export function hashInviteToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex")
}