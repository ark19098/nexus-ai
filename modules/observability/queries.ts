import { prisma } from "@/core/db/client"
import { PLAN_TOKEN_LIMITS } from "./costs"
import { unstable_cache } from "next/cache"
import { CACHE_TAGS } from "@/core/redis/cache-tags"

export async function checkTokenLimit(orgId: string): Promise<{
    used:        number
    limit:       number
    percentUsed: number
    isExceeded:  boolean
    isNearLimit: boolean // >= 80%
}> {
    const now = new Date();
    const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { plan: true, tokenLimit: true },
    });

    const limit = org?.tokenLimit ?? PLAN_TOKEN_LIMITS.FREE;

    const result = await prisma.aiUsage.aggregate({
        where: {
            organizationId: orgId,
            createdAt: { gte: monthStart },
            error: null,
        },
        _sum: { totalTokens: true },
    });

    const used = result._sum.totalTokens ?? 0;
    const percentUsed = limit > 0 ? (used / limit) * 100 : 0;

    return {
        used,
        limit,
        percentUsed: Math.round(percentUsed * 100) / 100,
        isExceeded: used > limit,
        isNearLimit: percentUsed >= 80 && used < limit,
    }
}

export function getMonthlyUsageSummary(orgId: string, year: number, month: number) {
    return unstable_cache(
        async () => {
            const monthStart = new Date(year, month - 1, 1);
            const monthEnd = new Date(year, month, 0);

            const result = await prisma.aiUsage.aggregate({
                where: {
                    organizationId: orgId,
                    createdAt: { gte: monthStart, lte: monthEnd },
                    error: null,
                },
                _sum: { totalTokens: true, cost: true, promptTokens: true, completionTokens: true },
                _count: { id: true },
                _avg: { latencyMs: true },
            });

            return {
                totalTokens:      result._sum.totalTokens      ?? 0,
                totalCost:        result._sum.cost              ?? 0,
                promptTokens:     result._sum.promptTokens      ?? 0,
                completionTokens: result._sum.completionTokens  ?? 0,
                queryCount:       result._count.id              ?? 0,
                avgLatencyMs:     Math.round(result._avg.latencyMs ?? 0),
            }
        },
        [`monthly-usage-${orgId}-${year}-${month}`],
        {
            tags:       [CACHE_TAGS.organization(orgId)],
            revalidate: 60, // refresh every minute
        }
    )()
}

export function getUsageByDay(orgId: string, days = 30) {
  return unstable_cache(
    async () => {
      const since = new Date()
      since.setDate(since.getDate() - days)
 
      const records = await prisma.aiUsage.findMany({
        where: {
          organizationId: orgId,
          createdAt:      { gte: since },
          error:          null,
        },
        select: {
          createdAt:   true,
          totalTokens: true,
          cost:        true,
        },
        orderBy: { createdAt: "asc" },
      })
 
      // Group by date string
      const byDay = new Map<string, { tokens: number; cost: number; queries: number }>()
 
      for (const record of records) {
        const dateKey = record.createdAt.toISOString().split("T")[0]! // YYYY-MM-DD
 
        const existing = byDay.get(dateKey) ?? { tokens: 0, cost: 0, queries: 0 }
        byDay.set(dateKey, {
          tokens:  existing.tokens  + record.totalTokens,
          cost:    existing.cost    + record.cost,
          queries: existing.queries + 1,
        })
      }
 
      // Fill in missing days with zeros for complete chart data
      const result: { date: string; tokens: number; cost: number; queries: number }[] = []
      const cursor = new Date(since)
 
      while (cursor <= new Date()) {
        const dateKey = cursor.toISOString().split("T")[0]!
        const data = byDay.get(dateKey) ?? { tokens: 0, cost: 0, queries: 0 }
        result.push({ date: dateKey, ...data })
        cursor.setDate(cursor.getDate() + 1)
      }
 
      return result
    },
    [`usage-by-day-${orgId}-${days}`],
    {
      tags:       [CACHE_TAGS.organization(orgId)],
      revalidate: 300,
    }
  )()
}
 
/**
 * Cost breakdown by model for the analytics page.
 */
export function getCostByModel(orgId: string, days = 30) {
  return unstable_cache(
    async () => {
      const since = new Date()
      since.setDate(since.getDate() - days)
 
      const records = await prisma.aiUsage.groupBy({
        by:    ["model"],
        where: {
          organizationId: orgId,
          createdAt:      { gte: since },
          error:          null,
        },
        _sum:   { totalTokens: true, cost: true },
        _count: { id: true },
        orderBy: { _sum: { cost: "desc" } },
      })
 
      return records.map((r) => ({
        model:       r.model,
        totalTokens: r._sum.totalTokens ?? 0,
        totalCost:   r._sum.cost        ?? 0,
        queryCount:  r._count.id        ?? 0,
      }))
    },
    [`cost-by-model-${orgId}-${days}`],
    {
      tags:       [CACHE_TAGS.organization(orgId)],
      revalidate: 300,
    }
  )()
}
 
/**
 * Top users by token consumption.
 */
export function getTopUsers(orgId: string, days = 30) {
  return unstable_cache(
    async () => {
      const since = new Date()
      since.setDate(since.getDate() - days)
 
      const records = await prisma.aiUsage.groupBy({
        by:    ["userId"],
        where: {
          organizationId: orgId,
          createdAt:      { gte: since },
          error:          null,
        },
        _sum:   { totalTokens: true, cost: true },
        _count: { id: true },
        orderBy: { _sum: { totalTokens: "desc" } },
        take: 10,
      })
 
      // Hydrate with user names
      const userIds = records.map((r) => r.userId)
      const users   = await prisma.user.findMany({
        where:  { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
 
      const userMap = new Map(users.map((u) => [u.id, u]))
 
      return records.map((r) => ({
        userId:      r.userId,
        name:        userMap.get(r.userId)?.name  ?? "Unknown",
        email:       userMap.get(r.userId)?.email ?? "",
        totalTokens: r._sum.totalTokens ?? 0,
        totalCost:   r._sum.cost        ?? 0,
        queryCount:  r._count.id        ?? 0,
      }))
    },
    [`top-users-${orgId}-${days}`],
    {
      tags:       [CACHE_TAGS.organization(orgId)],
      revalidate: 300,
    }
  )()
}
 
/**
 * Error rate for the last N days.
 * Useful for operational health monitoring.
 */
export function getErrorRate(orgId: string, days = 7) {
  return unstable_cache(
    async () => {
      const since = new Date()
      since.setDate(since.getDate() - days)
 
      const [total, errors] = await Promise.all([
        prisma.aiUsage.count({
          where: { organizationId: orgId, createdAt: { gte: since } },
        }),
        prisma.aiUsage.count({
          where: {
            organizationId: orgId,
            createdAt:      { gte: since },
            error:          { not: null },
          },
        }),
      ])
 
      return {
        total,
        errors,
        successRate: total > 0 ? ((total - errors) / total) * 100 : 100,
        errorRate:   total > 0 ? (errors / total) * 100 : 0,
      }
    },
    [`error-rate-${orgId}-${days}`],
    {
      tags:       [CACHE_TAGS.organization(orgId)],
      revalidate: 120,
    }
  )()
}