"use client"

import { useState, useTransition } from "react"
import { Shield, Trash2, Loader2, ChevronDown } from "lucide-react"
import { removeMemberAction, changeMemberRoleAction } from "@/modules/members/actions"
import { Role } from "@/core/db/generated"

interface Membership {
  id:   string
  role: string
  user: { id: string; name: string | null; email: string; image: string | null }
}

interface Props {
  memberships:     Membership[]
  orgId:           string
  currentUserId:   string
  currentUserRole: string
}

const ROLE_COLORS: Record<string, string> = {
  OWNER:  "text-yellow-400 bg-yellow-950 border-yellow-900",
  ADMIN:  "text-purple-400 bg-purple-950 border-purple-900",
  MEMBER: "text-cyan-400 bg-cyan-950 border-cyan-900",
  VIEWER: "text-zinc-400 bg-zinc-800 border-zinc-700",
}

export default function MembersList({
  memberships,
  orgId,
  currentUserId,
  currentUserRole,
}: Props) {
  const [localMembers, setLocalMembers] = useState(memberships)

  function handleRemoved(id: string) {
    setLocalMembers((prev) => prev.filter((m) => m.id !== id))
  }

  function handleRoleChanged(id: string, newRole: string) {
    setLocalMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole } : m))
    )
  }

  return (
    <div>
      <h2 className="text-white font-semibold text-sm mb-3">
        Team Members ({localMembers.length})
      </h2>

      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <ul className="divide-y divide-zinc-800">
          {localMembers.map((membership) => (
            <MemberRow
              key={membership.id}
              membership={membership}
              orgId={orgId}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onRemoved={handleRemoved}
              onRoleChanged={handleRoleChanged}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

function MemberRow({
  membership,
  orgId,
  currentUserId,
  currentUserRole,
  onRemoved,
  onRoleChanged,
}: {
  membership:      Membership
  orgId:           string
  currentUserId:   string
  currentUserRole: string
  onRemoved:       (id: string) => void
  onRoleChanged:   (id: string, role: string) => void
}) {
  const [removeP, startRemove] = useTransition()
  const [roleP,   startRole]   = useTransition()
  const [error, setError]      = useState<string | null>(null)

  const isMe       = membership.user.id === currentUserId
  const canManage  = currentUserRole === "OWNER" && !isMe && membership.role !== "OWNER"
  const canRemove  = ["OWNER", "ADMIN"].includes(currentUserRole) && !isMe && membership.role !== "OWNER"

  const initials = membership.user.name
    ? membership.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : membership.user.email[0]?.toUpperCase()

  function handleRemove() {
    startRemove(async () => {
      const result = await removeMemberAction(orgId, membership.id)
      if (result.error) setError(result.error)
      else onRemoved(membership.id)
    })
  }

  function handleRoleChange(newRole: string) {
    startRole(async () => {
      const result = await changeMemberRoleAction(orgId, membership.id, newRole as Role)
      if (result.error) setError(result.error)
      else onRoleChanged(membership.id, newRole)
    })
  }

  return (
    <li className="flex items-center gap-4 p-4 hover:bg-zinc-900/40 transition-colors">
      {/* Avatar */}
      <div className="w-9 h-9 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-zinc-300 text-sm font-semibold">{initials}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white text-sm font-medium truncate">
            {membership.user.name ?? membership.user.email}
          </p>
          {isMe && <span className="text-zinc-600 text-xs">(you)</span>}
        </div>
        <p className="text-zinc-600 text-xs truncate">{membership.user.email}</p>
        {error && <p className="text-red-400 text-xs mt-0.5">{error}</p>}
      </div>

      {/* Role badge / selector */}
      {canManage ? (
        <div className="relative">
          <select
            value={membership.role}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={roleP}
            className="appearance-none bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-3 py-1.5 pr-7 outline-none cursor-pointer"
          >
            <option value="VIEWER">Viewer</option>
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
        </div>
      ) : (
        <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${ROLE_COLORS[membership.role] ?? ROLE_COLORS.MEMBER}`}>
          {membership.role}
        </span>
      )}

      {/* Remove button */}
      {canRemove && (
        <button
          onClick={handleRemove}
          disabled={removeP}
          className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
          title="Remove member"
        >
          {removeP ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      )}
    </li>
  )
}