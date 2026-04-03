"use client"

import { formatCost } from "@/modules/observability/costs";
// modules/analytics/components/UsageSummaryCards.tsx

import { Zap, DollarSign, MessageSquare, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface Summary {
  totalTokens:      number
  totalCost:        number
  queryCount:       number
  avgLatencyMs:     number
  promptTokens:     number
  completionTokens: number
}

interface ErrorRate {
  total:       number
  errors:      number
  successRate: number
}

export default function UsageSummaryCards({
  summary,
  errorRate,
}: {
  summary:    Summary
  errorRate:  ErrorRate
}) {
  const cards = [
    {
      label: "Total Tokens",
      value: summary.totalTokens.toLocaleString(),
      sub:   `${summary.promptTokens.toLocaleString()} in · ${summary.completionTokens.toLocaleString()} out`,
      icon:  Zap,
      color: "text-cyan-400",
      bg:    "bg-cyan-950/40 border-cyan-900",
    },
    {
      label: "Total Cost",
      value: formatCost(summary.totalCost),
      sub:   "This month",
      icon:  DollarSign,
      color: "text-green-400",
      bg:    "bg-green-950/40 border-green-900",
    },
    {
      label: "Queries",
      value: summary.queryCount.toLocaleString(),
      sub:   "Successful chat requests",
      icon:  MessageSquare,
      color: "text-purple-400",
      bg:    "bg-purple-950/40 border-purple-900",
    },
    {
      label: "Avg Latency",
      value: `${summary.avgLatencyMs}ms`,
      sub:   "End-to-end RAG pipeline",
      icon:  Clock,
      color: "text-orange-400",
      bg:    "bg-orange-950/40 border-orange-900",
    },
    {
      label: "Success Rate",
      value: `${errorRate.successRate.toFixed(1)}%`,
      sub:   `${errorRate.errors} error${errorRate.errors !== 1 ? "s" : ""} / ${errorRate.total} total`,
      icon:  errorRate.successRate >= 99 ? CheckCircle : AlertTriangle,
      color: errorRate.successRate >= 99 ? "text-green-400" : "text-yellow-400",
      bg:    errorRate.successRate >= 99
        ? "bg-green-950/40 border-green-900"
        : "bg-yellow-950/40 border-yellow-900",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`border rounded-lg p-4 ${card.bg}`}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-zinc-500 text-xs uppercase tracking-wider">{card.label}</p>
            <card.icon className={`w-4 h-4 ${card.color}`} />
          </div>
          <p className={`text-2xl font-bold ${card.color} mb-1`}>{card.value}</p>
          <p className="text-zinc-600 text-xs">{card.sub}</p>
        </div>
      ))}
    </div>
  )
}