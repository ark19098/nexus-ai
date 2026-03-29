"use client"

import { formatCost } from "@/modules/observability/costs"

// modules/analytics/components/ModelBreakdown.tsx

interface ModelData {
  model:       string
  totalTokens: number
  totalCost:   number
  queryCount:  number
}

export default function ModelBreakdown({
  models,
}: {
  models:     ModelData[]
}) {
  const totalTokens = models.reduce((sum, m) => sum + m.totalTokens, 0)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <h3 className="text-white font-semibold text-sm mb-4">Cost by Model</h3>

      {models.length === 0 ? (
        <p className="text-zinc-700 text-sm">No model usage yet</p>
      ) : (
        <div className="space-y-3">
          {models.map((m) => {
            const pct = totalTokens > 0 ? (m.totalTokens / totalTokens) * 100 : 0
            const shortName = m.model.split("/").pop() ?? m.model

            return (
              <div key={m.model}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-zinc-400 text-xs truncate max-w-[160px]" title={m.model}>
                    {shortName}
                  </span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-zinc-500 text-xs">
                      {m.queryCount} queries
                    </span>
                    <span className="text-cyan-400 text-xs font-medium">
                      {formatCost(m.totalCost)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-cyan-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-zinc-700 text-xs mt-0.5">
                  {m.totalTokens.toLocaleString()} tokens ({pct.toFixed(1)}%)
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}