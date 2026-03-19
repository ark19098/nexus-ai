"use client"

import { useActionState } from "react"
import { createOrgAction } from "@/modules/workspace/actions"

export default function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return await createOrgAction(formData)
    },
    null
  )

  return (
    <form action={formAction} className="space-y-4">
      {/* Org name */}
      <div>
        <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
          Organization Name
        </label>
        <input
          name="orgName"
          type="text"
          placeholder="Acme Inc."
          required
          className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Workspace name */}
      <div>
        <label className="block text-zinc-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
          First Workspace Name
        </label>
        <input
          name="workspaceName"
          type="text"
          placeholder="My Workspace"
          className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
        />
        <p className="text-zinc-600 text-xs mt-1.5">
          Optional — defaults to "My Workspace"
        </p>
      </div>

      {/* Error */}
      {state?.error && (
        <div className="bg-red-950 border border-red-800 text-red-400 text-xs rounded-md px-3 py-2.5">
          {state.error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-950 font-semibold text-sm py-2.5 px-4 rounded-md transition-colors duration-150"
      >
        {isPending ? "Creating workspace..." : "Create workspace →"}
      </button>
    </form>
  )
}