"use client"

// app/(dashboard)/org/[orgId]/billing/_components/PlanCard.tsx

import { useState, useTransition } from "react"
import { Check, Loader2 } from "lucide-react"
import { PLANS, type PlanType, isUpgrade } from "@/lib/plans"
import { createCheckoutSessionAction } from "@/modules/billing/actions"

interface Props {
  plan:        PlanType
  currentPlan: PlanType
  orgId:       string
}

export default function PlanCard({ plan, currentPlan, orgId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError]            = useState<string | null>(null)

  const details   = PLANS[plan]
  const isCurrent = plan === currentPlan
  const canUpgrade = isUpgrade(currentPlan, plan)
  const isFree    = plan === "FREE"

  function handleUpgrade() {
    if (isCurrent || isFree) return
    setError(null)

    startTransition(async () => {
      const result = await createCheckoutSessionAction(plan)
      console.log(result, 'Upgraded');

      if (result?.error) {
        setError(result.error)
        return
      }

      if (result?.url) {
        window.location.href = result.url
      }
    })
  }

  const borderColor = isCurrent
    ? "border-cyan-700"
    : plan === "PRO"
    ? "border-zinc-700 hover:border-zinc-600"
    : "border-zinc-800 hover:border-zinc-700"

  const badgeColor = plan === "PRO"
    ? "bg-cyan-950 text-cyan-400 border-cyan-800"
    : "bg-zinc-800 text-zinc-400 border-zinc-700";

  return (
    <div
      className={`relative bg-zinc-900 border rounded-xl p-5 flex flex-col transition-colors ${borderColor}`}
    >
      {/* Popular badge */}
      {plan === "PRO" && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-cyan-500 text-zinc-950 text-xs font-bold px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      {/* Plan header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-white font-bold text-base">{details.name}</h3>
          {isCurrent && (
            <span className={`text-xs border px-2 py-0.5 rounded-full ${badgeColor}`}>
              Current
            </span>
          )}
        </div>
        <p className="text-zinc-500 text-xs leading-relaxed">{details.description}</p>
      </div>

      {/* Price */}
      <div className="mb-5">
        <span className="text-white text-3xl font-bold">
          {details.priceLabel.split(" / ")[0]}
        </span>
        {!isFree && (
          <span className="text-zinc-600 text-sm ml-1">/ month</span>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6 flex-1">
        {details.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
            <span className="text-zinc-400 text-xs">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs mb-3">{error}</p>
      )}

      {/* CTA button */}
      {isCurrent ? (
        <button
          disabled
          className="w-full py-2 px-4 rounded-lg bg-zinc-800 text-zinc-500 text-sm font-medium cursor-not-allowed"
        >
          Current Plan
        </button>
      ) : isFree ? (
        <button
          disabled
          className="w-full py-2 px-4 rounded-lg bg-zinc-800 text-zinc-500 text-sm font-medium cursor-not-allowed"
        >
          Free Forever
        </button>
      ) : (
        <button
          onClick={handleUpgrade}
          disabled={isPending}
          className={`
            w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2
            ${canUpgrade
              ? "bg-cyan-500 hover:bg-cyan-400 text-zinc-950"
              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            }
            disabled:opacity-60 disabled:cursor-not-allowed
          `}
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {canUpgrade ? `Upgrade to ${details.name}` : `Downgrade to ${details.name}`}
        </button>
      )}
    </div>
  )
}