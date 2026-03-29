"use client"

import { formatCost } from "@/modules/observability/costs"

// modules/analytics/components/TopUsersTable.tsx

interface UserData {
  userId:      string
  name:        string
  email:       string
  totalTokens: number
  totalCost:   number
  queryCount:  number
}

export default function TopUsersTable({
  users,
}: {
  users:      UserData[]
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <h3 className="text-white font-semibold text-sm mb-4">Top Users</h3>

      {users.length === 0 ? (
        <p className="text-zinc-700 text-sm">No user data yet</p>
      ) : (
        <div className="space-y-0">
          {/* Header */}
          <div className="grid grid-cols-3 gap-2 pb-2 border-b border-zinc-800">
            <span className="text-zinc-600 text-xs uppercase tracking-wider">User</span>
            <span className="text-zinc-600 text-xs uppercase tracking-wider text-right">Tokens</span>
            <span className="text-zinc-600 text-xs uppercase tracking-wider text-right">Cost</span>
          </div>

          {users.map((user, idx) => (
            <div
              key={user.userId}
              className="grid grid-cols-3 gap-2 py-2.5 border-b border-zinc-800/50 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-zinc-400 text-xs font-bold">{idx + 1}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-zinc-300 text-xs font-medium truncate">
                    {user.name || "Unknown"}
                  </p>
                  <p className="text-zinc-600 text-xs truncate">{user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-zinc-300 text-xs font-medium">
                  {user.totalTokens.toLocaleString()}
                </p>
                <p className="text-zinc-600 text-xs">{user.queryCount} queries</p>
              </div>
              <div className="text-right">
                <p className="text-cyan-400 text-xs font-medium">
                  {formatCost(user.totalCost)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}