"use client"

import { useState, useTransition } from "react"
import { Mail, Loader2, Copy, Check } from "lucide-react"
import { inviteMemberAction } from "@/modules/members/actions"
import { Role } from "@/core/db/generated"

interface Props {
  orgId:           string
  currentUserRole: Role
}

export default function InviteForm({ orgId, currentUserRole }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError]            = useState<string | null>(null)
  const [inviteUrl, setInviteUrl]    = useState<string | null>(null)
  const [copied, setCopied]          = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    setInviteUrl(null)

    startTransition(async () => {
      const result = await inviteMemberAction(orgId, formData)
      if (result.error) {
        setError(result.error)
      } else if (result.inviteUrl) {
        // Email failed — show URL as fallback
        setInviteUrl(result.inviteUrl)
      } else {
        // Reset form on success
        ;(e.target as HTMLFormElement).reset()
      }
    })
  }

  async function copyUrl() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h2 className="text-white font-semibold text-sm mb-4">Invite Team Member</h2>

      <form onSubmit={handleSubmit} className="flex gap-3 flex-wrap">
        {/* Email */}
        <div className="flex-1 min-w-[200px]">
          <input
            name="email"
            type="email"
            required
            placeholder="colleague@company.com"
            className="w-full bg-zinc-800 border border-zinc-700 focus:border-cyan-600 text-white placeholder-zinc-600 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
          />
        </div>

        {/* Role */}
        <select
          name="role"
          defaultValue="MEMBER"
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-2.5 text-sm outline-none"
        >
          <option value="VIEWER">Viewer</option>
          <option value="MEMBER">Member</option>
          {currentUserRole === "OWNER" && (
            <option value="ADMIN">Admin</option>
          )}
        </select>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          {isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Mail className="w-4 h-4" />
          }
          Send Invite
        </button>
      </form>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs mt-3">{error}</p>
      )}

      {/* Fallback invite URL (when email fails) */}
      {inviteUrl && (
        <div className="mt-3 bg-zinc-800 border border-zinc-700 rounded-lg p-3 flex items-center gap-2">
          <p className="text-zinc-400 text-xs flex-1 truncate">
            Email not configured. Share this link: <span className="text-cyan-400">{inviteUrl}</span>
          </p>
          <button
            onClick={copyUrl}
            className="flex-shrink-0 p-1.5 text-zinc-500 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}

      <p className="text-zinc-600 text-xs mt-3">
        An invitation email will be sent. The link expires in 48 hours.
      </p>
    </div>
  )
}