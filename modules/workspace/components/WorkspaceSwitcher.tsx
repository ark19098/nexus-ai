"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useRouter }              from "next/navigation"
import { ChevronDown, Plus, Check, Loader2 } from "lucide-react"
import { createWorkspaceAction }  from "@/modules/workspace/actions"

interface Workspace {
  id:   string
  name: string
}

interface Props {
  orgId:      string
  wsId:       string
  workspaces: Workspace[]
  canCreate:  boolean
}

export default function WorkspaceSwitcher({
  orgId,
  wsId,
  workspaces,
  canCreate,
}: Props) {
  const router                       = useRouter()
  const [open, setOpen]              = useState(false)
  const [creating, setCreating]      = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError]            = useState<string | null>(null)
  const [localWorkspaces, setLocal]  = useState(workspaces)
  const dropdownRef                  = useRef<HTMLDivElement>(null)

  const currentWorkspace = localWorkspaces.find((w) => w.id === wsId)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function switchWorkspace(newWsId: string) {
    if (newWsId === wsId) {
      setOpen(false); return
    }
    setOpen(false)
    router.push(`/org/${orgId}/workspace/${newWsId}`)
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)

    startTransition(async () => {
      const result = await createWorkspaceAction(orgId, formData)
      if (result.error) {
        setError(result.error)
      } else if (result.workspaceId) {
        const name = formData.get("name") as string
        setLocal((prev) => [...prev, { id: result.workspaceId!, name }])
        setCreating(false)
        setOpen(false)
        router.push(`/org/${orgId}/workspace/${result.workspaceId}`)
      }
    })
  }

  return (
    <div className="relative px-3 py-3 border-b border-zinc-800" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-lg hover:bg-zinc-800/60 transition-colors group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 bg-cyan-900 border border-cyan-800 rounded flex-shrink-0 flex items-center justify-center">
            <span className="text-cyan-400 text-xs font-bold">
              {currentWorkspace?.name?.[0]?.toUpperCase() ?? "W"}
            </span>
          </div>
          <span className="text-zinc-300 text-xs font-medium truncate">
            {currentWorkspace?.name ?? "Select workspace"}
          </span>
        </div>
        <ChevronDown className={`w-3 h-3 text-zinc-600 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Workspace list */}
          <div className="max-h-48 overflow-y-auto py-1">
            {localWorkspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => switchWorkspace(ws.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-zinc-800 transition-colors text-left"
              >
                <Check className={`w-3 h-3 flex-shrink-0 ${ws.id === wsId ? "text-cyan-400" : "text-transparent"}`} />
                <span className={ws.id === wsId ? "text-white font-medium" : "text-zinc-400"}>
                  {ws.name}
                </span>
              </button>
            ))}
          </div>

          {/* Create new workspace */}
          {canCreate && (
            <div className="border-t border-zinc-800 p-2">
              {!creating ? (
                <button
                  onClick={() => setCreating(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New workspace
                </button>
              ) : (
                <form onSubmit={handleCreate} className="flex gap-2">
                  <input
                    name="name"
                    autoFocus
                    placeholder="Workspace name"
                    className="flex-1 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-cyan-600"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-2 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-semibold rounded-lg transition-colors"
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                  </button>
                </form>
              )}
              {error && <p className="text-red-400 text-xs mt-1 px-3">{error}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}