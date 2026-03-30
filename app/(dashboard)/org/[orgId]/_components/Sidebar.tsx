"use client"

import Link from "next/link"
import {
  FileText,
  MessageSquare,
  BarChart2,
  Settings,
  Users,
  ChevronDown,
  CreditCard,
} from "lucide-react"
import { useParams } from "next/navigation"

interface Workspace {
  id: string
  name: string
}

interface SidebarProps {
  orgId: string
  workspaces: Workspace[]
  userEmail: string
  userName: string
  isOwner: boolean
  plan: string
}

export default function Sidebar({
  orgId,
  workspaces,
  userEmail,
  userName,
  isOwner,
  plan,
}: SidebarProps) {
  const params = useParams();
  const urlWsId = params.wsId as string | undefined;

  // FALLBACK: If they are on the Analytics page (no wsId in URL), default to the first workspace so the links still work!
  const activeWsId = urlWsId && workspaces.some(ws => ws.id === urlWsId) ? urlWsId : workspaces[0]?.id;

  const currentWorkspace = workspaces.find(ws => ws.id === activeWsId);

  const navItems = [
    {
      label: "Documents",
      href: `/org/${orgId}/workspace/${activeWsId}/documents`,
      icon: FileText,
    },
    {
      label: "Chat",
      href: `/org/${orgId}/workspace/${activeWsId}/chat`,
      icon: MessageSquare,
    },
  ]

  const orgItems = [
    {
      label: "Analytics",
      href: `/org/${orgId}/analytics`,
      icon: BarChart2,
    },
    ...(isOwner ? [{
      label: "Billing",
      href: `/org/${orgId}/billing`,
      icon: CreditCard,
    }] : []),
    {
      label: "Members",
      href: `/org/${orgId}/settings/members`,
      icon: Users,
    },
    {
      label: "Settings",
      href: `/org/${orgId}/settings`,
      icon: Settings,
    },
  ]

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Logo */}
      <div className="h-14 border-b border-zinc-800 flex items-center px-4 gap-2 flex-shrink-0">
        <div className="w-6 h-6 bg-cyan-400 rounded-sm rotate-12 flex-shrink-0" />
        <span className="text-white font-bold text-sm tracking-tight">
          Nexus AI
        </span>
      </div>

      {/* Workspace switcher */}
      <div className="px-3 py-3 border-b border-zinc-800">
        <button className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md hover:bg-zinc-800/60 transition-colors group">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 bg-cyan-900 rounded flex-shrink-0 flex items-center justify-center">
              <span className="text-cyan-400 text-xs font-bold">
                {currentWorkspace?.name?.[0]?.toUpperCase() ?? "W"}
              </span>
            </div>
            <span className="text-zinc-300 text-xs font-medium truncate">
              {currentWorkspace?.name ?? "Workspace"}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-zinc-600 flex-shrink-0" />
        </button>
      </div>

      {/* Workspace nav */}
      <div className="px-3 py-3 flex-1 overflow-auto">
        <p className="text-zinc-600 text-xs uppercase tracking-wider px-2 mb-2">
          Workspace
        </p>
        <nav className="space-y-0.5 mb-6">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-2 py-2 text-zinc-500 hover:text-white hover:bg-zinc-800/60 rounded-md text-sm transition-colors group"
            >
              <item.icon className="w-4 h-4 flex-shrink-0 group-hover:text-cyan-400 transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Org nav */}
        <p className="text-zinc-600 text-xs uppercase tracking-wider px-2 mb-2">
          Organization
        </p>
        <nav className="space-y-0.5">
          {orgItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-2 py-2 text-zinc-500 hover:text-white hover:bg-zinc-800/60 rounded-md text-sm transition-colors group"
            >
              <item.icon className="w-4 h-4 flex-shrink-0 group-hover:text-cyan-400 transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {plan === "FREE" && (
        <div className="px-3 py-4 mt-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <p className="text-white text-base font-semibold mb-1">Unlock Pro</p>
            <p className="text-zinc-500 text-sm mb-3 leading-tight">
              Get 1M tokens and advanced AI models.
            </p>
            <Link 
              href={`/org/${orgId}/billing`}
              className="block w-full text-center bg-cyan-600 hover:bg-cyan-500 text-white text-sm tracking-wide font-medium py-1.5 rounded transition-colors"
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}
      {/* User footer */}
      <div className="border-t border-zinc-800 px-3 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-2 py-2">
          {/* Avatar */}
          <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
            <span className="text-zinc-300 text-xs font-medium">
              {userName?.[0]?.toUpperCase() ?? userEmail?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            {userName && (
              <p className="text-zinc-300 text-xs font-medium truncate">
                {userName}
              </p>
            )}
            <p className="text-zinc-600 text-xs truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </div>
  )
}