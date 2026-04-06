"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Check, Loader2, Building2 } from "lucide-react"
import { switchOrgAction } from "@/core/auth/actions"
import { Role } from "@/core/db/generated"

interface Membership {
  id:           string
  role:         string
  organization: { id: string; name: string }
}

interface Props {
  currentOrgId: string
  memberships:  Membership[]
}

export default function OrgSwitcher({ currentOrgId, memberships }: Props) {
  const router                       = useRouter();
  const [open, setOpen]              = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef                  = useRef<HTMLDivElement>(null);

  const currentOrg = memberships.find((m) => m.organization.id === currentOrgId)?.organization;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, []);

  function switchOrg(newOrgId: string, newRole: string) {
    if (newOrgId === currentOrgId) { setOpen(false); return; }
    setOpen(false);
    startTransition(async () => {
      // 1. Rewrite JWT first — must complete before navigation
      await switchOrgAction(newOrgId, newRole as Role);
      // 2. Traffic cop at /org/[orgId] redirects to first workspace
      router.push(`/org/${newOrgId}`);
    });
  }

  return (
    <div className="relative px-3 py-2 border-b border-zinc-800" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors group disabled:opacity-50"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 bg-zinc-800 border border-zinc-700 rounded shrink-0 flex items-center justify-center">
            {isPending
              ? <Loader2 className="w-3 h-3 text-zinc-400 animate-spin" />
              : <Building2 className="w-3 h-3 text-zinc-500" />
            }
          </div>
          <span className="text-zinc-400 text-xs font-medium truncate">
            {currentOrg?.name ?? "Select org"}
          </span>
        </div>
        <ChevronDown className={`w-3 h-3 text-zinc-600 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <p className="px-3 pt-2 pb-1 text-zinc-600 text-xs uppercase tracking-wider">
            Organizations
          </p>
          <div className="max-h-56 overflow-y-auto pb-1">
            {memberships.map((m) => (
              <button
                key={m.organization.id}
                onClick={() => switchOrg(m.organization.id, m.role)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-5 h-5 rounded shrink-0 flex items-center justify-center text-xs font-bold ${
                    m.organization.id === currentOrgId
                      ? "bg-cyan-900 text-cyan-400"
                      : "bg-zinc-800 text-zinc-500"
                  }`}>
                    {m.organization.name[0].toUpperCase()}
                  </div>
                  <span className={m.organization.id === currentOrgId ? "text-white font-medium" : "text-zinc-400"}>
                    {m.organization.name}
                  </span>
                </div>
                {m.organization.id === currentOrgId && (
                  <Check className="w-3 h-3 text-cyan-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}