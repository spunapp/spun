"use client"

import { useState } from "react"
import { Menu, X, Settings, LogOut, Palette, RotateCcw, MessageSquare, Plus } from "lucide-react"
import { useClerk, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { useChatSidebar } from "./ChatSidebarContext"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const { signOut } = useClerk()
  const { user } = useUser()
  const router = useRouter()
  const resetBusiness = useMutation(api.businesses.resetBusiness)

  async function handleLogout() {
    await signOut({ redirectUrl: "/login" })
  }

  async function handleStartOver() {
    if (!user?.id) return
    setResetting(true)
    try {
      await resetBusiness({ userId: user.id })
      setShowResetConfirm(false)
      setSidebarOpen(false)
      router.push("/chat")
      router.refresh()
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="h-screen flex bg-[var(--background)] text-white">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-30 p-2 bg-[var(--background-dark)] border border-white/10 rounded-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-50 lg:z-auto w-64 h-full bg-[var(--background-dark)] border-r border-white/5 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <img src="/spun.gif" alt="" width={28} height={28} className="rounded shrink-0 w-7 h-7 object-contain" />
            <span className="font-bold text-sm">Spun</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-white/5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation list */}
        <SidebarConversations onCloseMobile={() => setSidebarOpen(false)} />

        {/* Footer */}
        <div className="border-t border-white/5 p-3 space-y-1">
          <button
            onClick={() => router.push("/brand-assets")}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <Palette className="w-3.5 h-3.5" />
            Brand assets
          </button>
          <button
            onClick={() => router.push("/settings")}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Start over
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">{children}</main>

      {/* Start Over confirmation dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-[var(--background-dark)] border border-white/10 rounded-2xl p-6 max-w-sm mx-4 space-y-4">
            <h3 className="text-white font-semibold text-lg">Start over?</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              This will delete your business profile, conversations, and brand assets. Your connected channels (Meta, Google, etc.) will be kept.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 text-sm text-slate-300 hover:text-white border border-white/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartOver}
                disabled={resetting}
                className="flex-1 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {resetting ? "Resetting…" : "Yes, start over"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SidebarConversations({ onCloseMobile }: { onCloseMobile: () => void }) {
  const { user } = useUser()
  const userId = user?.id ?? null
  const conversations = useQuery(api.conversations.list, userId ? { userId } : "skip")
  const business = useQuery(api.businesses.getByUser, userId ? { userId } : "skip")
  const createConversation = useMutation(api.conversations.create)
  const ctx = useChatSidebar()

  async function handleNew() {
    if (!userId) return
    const id = await createConversation({
      userId,
      businessId: business?._id,
      title: business ? "Marketing Strategy" : "Getting Started",
    })
    ctx?.onSelectConversation(id as string)
    onCloseMobile()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-3">
        <button
          onClick={handleNew}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 rounded-lg transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {(conversations ?? []).map((conv: { _id: string; title?: string; _creationTime: number }) => (
          <button
            key={conv._id}
            onClick={() => {
              ctx?.onSelectConversation(conv._id as string)
              onCloseMobile()
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-all text-left ${
              ctx?.activeConversationId === conv._id
                ? "bg-[#5B9BAA]/20 text-[#5B9BAA] border border-[#5B9BAA]/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {conv.title || "New conversation"}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
