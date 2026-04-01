// app/(dashboard)/org/[orgId]/analytics/page.tsx

import { auth }                    from "@/core/auth/config"
import { redirect }                from "next/navigation"
import {
  getMonthlyUsageSummary,
  getUsageByDay,
  getCostByModel,
  getTopUsers,
  getErrorRate,
  checkTokenLimit,
}                                  from "@/modules/observability/queries"
import UsageSummaryCards           from "@/modules/analytics/components/UsageSummaryCards"
import UsageChart                  from "@/modules/analytics/components/UsageChart"
import TokenLimitBar               from "@/modules/analytics/components/TokenLimitBar"
import ModelBreakdown              from "@/modules/analytics/components/ModelBreakdown"
import TopUsersTable               from "@/modules/analytics/components/TopUsersTable"

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const session   = await auth()

  if (!session?.user) redirect("/login")

  // Only OWNER and ADMIN can see analytics
  if (!["OWNER", "ADMIN"].includes(session.user.role ?? "")) {
    return (
      <div className="p-8 text-zinc-500 text-sm">
        You don&apos;t have permission to view analytics.
      </div>
    )
  }

  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1

  // Parallel fetch — all queries run simultaneously
  const [summary, dailyUsage, modelBreakdown, topUsers, errorRate, tokenStatus] =
    await Promise.all([
      getMonthlyUsageSummary(orgId, year, month),
      getUsageByDay(orgId, 30),
      getCostByModel(orgId, 30),
      getTopUsers(orgId, 30),
      getErrorRate(orgId, 7),
      checkTokenLimit(orgId),
    ])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {new Date(year, month - 1).toLocaleString("default", { month: "long", year: "numeric" })} · Usage and cost overview
        </p>
      </div>

      {/* Token limit bar */}
      <TokenLimitBar tokenStatus={tokenStatus} />

      {/* Summary cards */}
      <UsageSummaryCards
        summary={summary}
        errorRate={errorRate}
      />

      {/* Usage over time chart */}
      <UsageChart data={dailyUsage} />

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModelBreakdown models={modelBreakdown} />
        <TopUsersTable  users={topUsers} />
      </div>
    </div>
  )
}