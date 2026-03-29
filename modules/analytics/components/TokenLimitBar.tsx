"use client"

// modules/analytics/components/TokenLimitBar.tsx

interface TokenStatus {
  used:        number
  limit:       number
  percentUsed: number
  isExceeded:  boolean
  isNearLimit: boolean
}

export function TokenLimitBar({ tokenStatus }: { tokenStatus: TokenStatus }) {
  const { used, limit, percentUsed, isExceeded, isNearLimit } = tokenStatus
  const pct = Math.min(percentUsed, 100)

  const barColor = isExceeded
    ? "bg-red-500"
    : isNearLimit
    ? "bg-yellow-500"
    : "bg-cyan-500"

  const textColor = isExceeded
    ? "text-red-400"
    : isNearLimit
    ? "text-yellow-400"
    : "text-cyan-400"

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-zinc-400 text-sm font-medium">Monthly Token Usage</span>
        <span className={`text-sm font-bold ${textColor}`}>
          {percentUsed.toFixed(1)}%
          {isExceeded && " — Limit Reached"}
          {isNearLimit && !isExceeded && " — Approaching Limit"}
        </span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-600">
        <span>{used.toLocaleString()} tokens used</span>
        <span>{limit.toLocaleString()} token limit</span>
      </div>
      {isExceeded && (
        <p className="mt-2 text-red-400 text-xs">
          Monthly limit reached. Upgrade your plan to continue using AI features.
        </p>
      )}
    </div>
  )
}

export default TokenLimitBar