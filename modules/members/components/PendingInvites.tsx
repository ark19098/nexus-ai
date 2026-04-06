"use client"

import { useState, useTransition } from "react"
import { Clock, X, Loader2 }      from "lucide-react"
import { cancelInviteAction }      from "@/modules/members/actions"
import { Role } from "@/core/db/generated"

interface Invite {
  id:          string
  email:       string
  role:        Role
  expiresAt:   Date
  createdAt:   Date
  invitedBy:   { name: string | null }
}

export default function PendingInvites({
  invites: initialInvites,
  orgId,
}: {
  invites: Invite[]
  orgId:   string
}) {
  const [invites, setInvites] = useState(initialInvites)

  function handleCancelled(id: string) {
    setInvites((prev) => prev.filter((i) => i.id !== id))
  }

  if (invites.length === 0) return null

  return (
    <div>
      <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-yellow-500" />
        Pending Invites ({invites.length})
      </h2>

      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <ul className="divide-y divide-zinc-800">
          {invites.map((invite) => (
            <InviteRow
              key={invite.id}
              invite={invite}
              orgId={orgId}
              onCancelled={handleCancelled}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

function InviteRow({
  invite,
  orgId,
  onCancelled,
}: {
  invite:      Invite
  orgId:       string
  onCancelled: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()

  const expiresIn = Math.ceil(
    (new Date(invite.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)
  )

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelInviteAction(orgId, invite.id)
      if (!result.error) onCancelled(invite.id)
    })
  }

  return (
    <li className="flex items-center gap-4 p-4">
      <div className="w-9 h-9 bg-yellow-950 border border-yellow-900 rounded-full flex items-center justify-center flex-shrink-0">
        <Clock className="w-4 h-4 text-yellow-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium">{invite.email}</p>
        <p className="text-zinc-600 text-xs">
          Invited as {invite.role} by {invite.invitedBy.name ?? "unknown"} · expires in {expiresIn}h
        </p>
      </div>

      <span className="text-xs px-2.5 py-1 rounded-lg border bg-yellow-950 text-yellow-400 border-yellow-900 font-medium">
        Pending
      </span>

      <button
        onClick={handleCancel}
        disabled={isPending}
        className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
        title="Cancel invite"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
      </button>
    </li>
  )
}