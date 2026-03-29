"use client"

// app/(dashboard)/org/[orgId]/billing/_components/BillingPortalButton.tsx

import { useState, useTransition } from "react"
import { ExternalLink, Loader2 }   from "lucide-react"
import { createPortalSessionAction } from "@/modules/billing/actions"

export default function BillingPortalButton() {
  const [isPending, startTransition] = useTransition()
  const [error, setError]            = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await createPortalSessionAction()

      if (result?.error) {
        setError(result.error)
        return
      }

      if (result?.url) {
        window.location.href = result.url
      }
    })
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
      >
        {isPending
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <ExternalLink className="w-4 h-4" />
        }
        Manage Subscription
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-1.5">{error}</p>
      )}
    </div>
  )
}