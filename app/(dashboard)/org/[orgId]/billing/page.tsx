// app/(dashboard)/org/[orgId]/billing/page.tsx

import { auth }                    from "@/core/auth/config"
import { redirect }                from "next/navigation"
import { prisma }                      from "@/core/db/client"
import {
  getMonthlyUsageSummary,
  checkTokenLimit,
}                                  from "@/modules/observability/queries"
import { PLANS, type PlanType, isUpgrade } from "@/lib/plans"
import CurrentPlanBanner           from "./_components/CurrentPlanBanner"
import PlanCard                    from "./_components/PlanCard"
import BillingPortalButton         from "./_components/BillingPortalButton"

export const dynamic = "force-dynamic" // always fresh — billing data must never be stale

export default async function BillingPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const session   = await auth()

  if (!session?.user) redirect("/login")

  // Only OWNER sees billing
  if (session.user.role !== "OWNER") {
    return (
      <div className="p-8">
        <p className="text-zinc-500 text-sm">
          Only the organization owner can manage billing.
        </p>
      </div>
    )
  }

  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1

  const [org, monthlySummary, tokenStatus] = await Promise.all([
    prisma.organization.findUnique({
      where:  { id: orgId },
      select: { plan: true, tokenLimit: true, stripeCustomerId: true, stripeSubscriptionId: true },
    }),
    getMonthlyUsageSummary(orgId, year, month),
    checkTokenLimit(orgId),
  ])

  const currentPlan = (org?.plan ?? "FREE") as PlanType

  // Handle success/cancel redirects from Stripe
  // These are read via searchParams in a client component
  // The page itself stays server-rendered

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Manage your subscription and view token usage
        </p>
      </div>

      {/* Current plan + usage */}
      <CurrentPlanBanner
        currentPlan={currentPlan}
        tokenStatus={tokenStatus}
        monthlySummary={monthlySummary}
        hasStripeAccount={!!org?.stripeCustomerId}
      />

      {/* Manage subscription button — only if on paid plan */}
      {org?.stripeCustomerId && currentPlan !== "FREE" && (
        <div className="flex justify-end">
          <BillingPortalButton />
        </div>
      )}

      {/* Plan comparison */}
      <div>
        <h2 className="text-white font-semibold text-lg mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(PLANS) as PlanType[]).map((plan) => (
            <PlanCard
              key={plan}
              plan={plan}
              currentPlan={currentPlan}
              orgId={orgId}
            />
          ))}
        </div>
      </div>

      <p className="text-zinc-700 text-xs text-center">
        Payments are processed securely by Stripe. Cancel anytime via the customer portal.
      </p>
    </div>
  )
}