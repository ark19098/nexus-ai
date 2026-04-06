// lib/email.ts
// Email sending via Resend
// Install: npm install resend

import { env } from "@/core/env/env.mjs"

// Lazy init — only instantiate when needed
let resendClient: import("resend").Resend | null = null

async function getResend() {
  if (!resendClient) {
    const { Resend } = await import("resend")
    resendClient = new Resend(env.RESEND_API_KEY)
  }
  return resendClient
}

export async function sendInviteEmail(
  toEmail:   string,
  inviteUrl: string,
  orgName:   string,
  inviterName: string
): Promise<void> {
  const resend = await getResend()

  const { error } = await resend.emails.send({
    from:    env.RESEND_FROM_EMAIL,
    to:      toEmail,
    subject: `${inviterName} invited you to ${orgName} on TeamDoQ`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; background: #09090b; color: #e4e4e7; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px;">
            <!-- Text wordmark: inline SVG is often stripped by Gmail/Outlook — use a visible cyan Q -->
            <div style="margin-bottom: 24px; font-size: 20px; line-height: 1.2;">
              <span style="font-weight: 700; color: #fafafa; letter-spacing: -0.02em;">TeamDo</span><span style="font-weight: 700; color: #38bdf8;">Q</span>
            </div>

            <h2 style="color: white; margin: 0 0 12px;">You've been invited</h2>
            <p style="color: #a1a1aa; margin: 0 0 8px;">
              <strong style="color: #e4e4e7;">${inviterName}</strong> has invited you to join
              <strong style="color: #e4e4e7;">${orgName}</strong> on TeamDoQ.
            </p>
            <p style="color: #71717a; font-size: 14px; margin: 0 0 28px;">
              TeamDoQ lets your team upload documents and ask questions using AI — with source citations.
            </p>

            <a
              href="${inviteUrl}"
              style="display: inline-block; background: #06b6d4; color: #09090b; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none;"
            >
              Accept Invitation →
            </a>

            <p style="color: #52525b; font-size: 12px; margin: 24px 0 0;">
              This invite expires in 48 hours. If you didn't expect this, you can ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
  })

  if (error) {
    console.error("[EMAIL] Failed to send invite email:", error)
    throw new Error("Failed to send invitation email")
  }
}