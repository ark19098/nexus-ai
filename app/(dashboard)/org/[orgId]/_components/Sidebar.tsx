"use client"

import Link from "next/link"
import {
  FileText,
  MessageSquare,
  BarChart2,
  Settings,
  Users,
  CreditCard,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { usePathname, useParams } from "next/navigation"
import { useState } from "react"
import { signOutAction } from "@/core/auth/actions"
import WorkspaceSwitcher from "@/modules/workspace/components/WorkspaceSwitcher"
import { TeamDoQLogo } from "@/components/brand/TeamDoQLogo"
import OrgSwitcher from "@/modules/organization/components/OrgSwitcher"

interface Workspace {
  id:   string
  name: string
}

interface SidebarProps {
  orgId:      string
  wsId:       string
  workspaces: Workspace[]
  userEmail:  string
  userName:   string
  isOwner:    boolean
  canCreate:  boolean
  plan:       string
  userOrgs:   { id: string; role: string; organization: { id: string; name: string } }[]
}

export default function Sidebar({
  orgId,
  wsId,
  workspaces,
  userEmail,
  userName,
  isOwner,
  canCreate,
  plan,
  userOrgs,
}: SidebarProps) {
  const pathname    = usePathname();
  const params      = useParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Read wsId from the live URL — falls back to the server-provided prop (for pages
  // without a wsId segment like analytics/billing so nav links still work)
  const urlWsId = (params.wsId as string | undefined)
  const activeWsId = urlWsId && workspaces.some((w) => w.id === urlWsId)
    ? urlWsId
    : wsId;

  const userInitial = (userName[0] ?? userEmail[0] ?? "U").toUpperCase();

  const navItems = [
    { label: "Documents", href: `/org/${orgId}/workspace/${activeWsId}/documents`, icon: FileText },
    { label: "Chat",      href: `/org/${orgId}/workspace/${activeWsId}/chat`,      icon: MessageSquare },
  ]

  const orgItems = [
    { label: "Analytics", href: `/org/${orgId}/analytics`,        icon: BarChart2  },
    ...(isOwner ? [{ label: "Billing", href: `/org/${orgId}/billing`, icon: CreditCard }] : []),
    { label: "Members",   href: `/org/${orgId}/members`, icon: Users      },
    { label: "Settings",  href: `/org/${orgId}/settings`,         icon: Settings   },
  ]

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  const navLinkClass = (href: string) =>
    `flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors group ${
      isActive(href)
        ? "bg-zinc-800 text-white"
        : "text-zinc-500 hover:text-white hover:bg-zinc-800/60"
    }`

  const sidebarContent = (
    <div className="h-full flex flex-col bg-zinc-950">

      {/* ── Logo ── */}
      <div className="h-14 border-b border-zinc-800 flex items-center px-4 gap-2 shrink-0">
        <TeamDoQLogo className="flex-1 min-w-0" size="sm" />
        <button
          className="md:hidden p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <OrgSwitcher
        currentOrgId={orgId}
        memberships={userOrgs}
      />

      <WorkspaceSwitcher
        orgId={orgId}
        wsId={activeWsId}
        workspaces={workspaces}
        canCreate={canCreate}
      />

      {/* ── Navigation ── */}
      <div className="flex-1 overflow-auto px-3 py-3">
        <p className="text-zinc-600 text-xs uppercase tracking-wider px-2 mb-2">Workspace</p>
        <nav className="space-y-0.5 mb-5">
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

        <p className="text-zinc-600 text-xs uppercase tracking-wider px-2 mb-2">Organization</p>
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

      {/* ── Upgrade nudge (FREE plan only) ── */}
      {plan === "FREE" && isOwner && (
        <div className="px-3 pb-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <p className="text-white text-xs font-semibold mb-0.5">Unlock Pro</p>
            <p className="text-zinc-500 text-xs mb-2 leading-tight">
              Get 1M tokens and advanced AI models.
            </p>
            <Link
              href={`/org/${orgId}/billing`}
              className="block w-full text-center bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium py-1.5 rounded transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}

      {/* ── User footer ── */}
      <div className="border-t border-zinc-800 px-3 py-3 shrink-0">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
            <span className="text-zinc-300 text-xs font-semibold">{userInitial}</span>
          </div>
          <div className="flex-1 min-w-0">
            {userName && (
              <p className="text-zinc-300 text-xs font-medium truncate">{userName}</p>
            )}
            <p className="text-zinc-600 text-xs truncate">{userEmail}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop: static sidebar ── */}
      <div className="hidden md:flex h-screen w-full flex-col">{sidebarContent}</div>

      {/* ── Mobile: hamburger + slide-in drawer ── */}
      <div className="md:hidden">
        <button
          className="fixed top-3.5 left-4 z-40 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}

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
