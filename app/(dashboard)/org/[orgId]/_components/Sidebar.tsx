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
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useParams, usePathname } from "next/navigation"
import { useState } from "react"
import { signOutAction } from "@/core/auth/actions"

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
  const params = useParams()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const urlWsId = params.wsId as string | undefined
  const activeWsId =
    urlWsId && workspaces.some((ws) => ws.id === urlWsId)
      ? urlWsId
      : workspaces[0]?.id

  const currentWorkspace = workspaces.find((ws) => ws.id === activeWsId)

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
    ...(isOwner
      ? [
          {
            label: "Billing",
            href: `/org/${orgId}/billing`,
            icon: CreditCard,
          },
        ]
      : []),
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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  const navLinkClass = (href: string) =>
    `flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors group ${
      isActive(href)
        ? "bg-zinc-800 text-white"
        : "text-zinc-500 hover:text-white hover:bg-zinc-800/60"
    }`

  const sidebarContent = (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Logo */}
      <div className="h-14 border-b border-zinc-800 flex items-center px-4 gap-2 shrink-0">
          <div className="w-6 h-6 bg-cyan-400 rounded-sm rotate-12 shrink-0" />
        <span className="text-white font-bold text-sm tracking-tight flex-1">
          Nexus AI
        </span>
        {/* Close button — mobile only */}
        <button
          className="md:hidden p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Workspace switcher */}
      <div className="px-3 py-3 border-b border-zinc-800">
        <button className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded-md hover:bg-zinc-800/60 transition-colors group">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 bg-cyan-900 rounded shrink-0 flex items-center justify-center">
              <span className="text-cyan-400 text-xs font-bold">
                {currentWorkspace?.name?.[0]?.toUpperCase() ?? "W"}
              </span>
            </div>
            <span className="text-zinc-300 text-xs font-medium truncate">
              {currentWorkspace?.name ?? "Workspace"}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-zinc-600 shrink-0" />
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
              className={navLinkClass(item.href)}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="w-4 h-4 shrink-0 group-hover:text-cyan-400 transition-colors" />
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
              className={navLinkClass(item.href)}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="w-4 h-4 shrink-0 group-hover:text-cyan-400 transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {plan === "FREE" && (
        <div className="px-3 py-4 mt-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <p className="text-white text-sm font-semibold mb-1">Unlock Pro</p>
            <p className="text-zinc-500 text-xs mb-3 leading-tight">
              Get 1M tokens and advanced AI models.
            </p>
            <Link
              href={`/org/${orgId}/billing`}
              className="block w-full text-center bg-cyan-600 hover:bg-cyan-500 text-white text-xs tracking-wide font-medium py-1.5 rounded transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}

      {/* User footer */}
      <div className="px-3 py-3 shrink-0">
        <form className="w-full" action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-2 py-2 border-zinc-800 border rounded-md hover:bg-red-500/60 hover:text-white hover:cursor-pointer transition-colors group"
          >
            <LogOut className="w-4 h-4 shrink-0 text-zinc-500 group-hover:text-white transition-colors" />
            <span className="text-zinc-500 text-xs group-hover:text-white transition-colors">
              Sign Out
            </span>
          </button>
        </form>
        <div className="border-t border-zinc-800 flex items-center gap-2 px-2 py-2 mt-2">
          <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
            <span className="text-zinc-300 text-xs font-medium">
              {userName?.[0]?.toUpperCase() ?? userEmail?.[0]?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            {userName && (
              <p className="text-zinc-300 text-xs font-medium truncate">{userName}</p>
            )}
            <p className="text-zinc-600 text-xs truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop: static sidebar (rendered by the hidden md:flex aside in layout) ── */}
      <div className="hidden md:flex h-screen w-full flex-col">{sidebarContent}</div>

      {/* ── Mobile: hamburger button + slide-in drawer ── */}
      <div className="md:hidden">
        {/* Hamburger — fixed top-left on mobile */}
        <button
          className="fixed top-3.5 left-4 z-40 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Drawer */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  )
}
