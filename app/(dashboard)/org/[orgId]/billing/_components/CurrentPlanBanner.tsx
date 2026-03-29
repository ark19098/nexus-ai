"use client"

// app/(dashboard)/org/[orgId]/billing/_components/CurrentPlanBanner.tsx

import { PLANS, type PlanType } from "@/lib/plans"
import { Zap, DollarSign, TrendingUp } from "lucide-react"

interface TokenStatus {
  used:        number
  limit:       number
  percentUsed: number
  isExceeded:  boolean
  isNearLimit: boolean
}

interface MonthlySummary {
  totalTokens:  number
  totalCost:    number
  queryCount:   number
  avgLatencyMs: number
}

interface Props {
  currentPlan:     PlanType
  tokenStatus:     TokenStatus
  monthlySummary:  MonthlySummary
  formatCost:      (n: number) => string
  hasStripeAccount: boolean
}

export default function CurrentPlanBanner({
  currentPlan,
  tokenStatus,
  monthlySummary,
  formatCost,
  hasStripeAccount,
}: Props) {
  const plan = PLANS[currentPlan]
  const pct  = Math.min(tokenStatus.percentUsed, 100)

  const barColor = tokenStatus.isExceeded
    ? "bg-red-500"
    : tokenStatus.isNearLimit
    ? "bg-yellow-500"
    : "bg-cyan-500"

  const statusColor = tokenStatus.isExceeded
    ? "text-red-400"
    : tokenStatus.isNearLimit
    ? "text-yellow-400"
    : "text-cyan-400"

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
      {/* Plan name + status */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-bold text-lg">{plan.name} Plan</span>
            <span className="text-xs bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded-full font-medium">
              Current
            </span>
          </div>
          <p className="text-zinc-500 text-sm">{plan.description}</p>
        </div>
        <div className="text-right">
          <p className="text-white font-bold">{plan.priceLabel}</p>
          {!hasStripeAccount && currentPlan !== "FREE" && (
            <p className="text-zinc-600 text-xs mt-0.5">Manual plan</p>
          )}
        </div>
      </div>

      {/* Token usage bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-400 text-sm">Token Usage This Month</span>
          <span className={`text-sm font-bold ${statusColor}`}>
            {tokenStatus.percentUsed.toFixed(1)}%
            {tokenStatus.isExceeded && " — Limit Reached"}
            {tokenStatus.isNearLimit && !tokenStatus.isExceeded && " — Near Limit"}
          </span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2.5 mb-1.5">
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-600">
          <span>{tokenStatus.used.toLocaleString()} tokens used</span>
          <span>{tokenStatus.limit.toLocaleString()} token limit</span>
        </div>
      </div>

      {/* This month stats */}
      <div className="grid grid-cols-3 gap-4 pt-2 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-600 flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-semibold">
              {monthlySummary.totalTokens.toLocaleString()}
            </p>
            <p className="text-zinc-600 text-xs">Tokens used</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-semibold">
              {formatCost(monthlySummary.totalCost)}
            </p>
            <p className="text-zinc-600 text-xs">Compute cost</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <div>
            <p className="text-white text-sm font-semibold">
              {monthlySummary.queryCount.toLocaleString()}
            </p>
            <p className="text-zinc-600 text-xs">Queries run</p>
          </div>
        </div>
      </div>

      {tokenStatus.isExceeded && (
        <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3">
          <p className="text-red-300 text-sm font-medium">
            Monthly token limit reached
          </p>
          <p className="text-red-500 text-xs mt-0.5">
            AI chat is disabled until you upgrade or next month begins.
          </p>
        </div>
      )}
    </div>
  )
}