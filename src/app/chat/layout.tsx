"use client"

import { useState } from "react"
import Image from "next/image"
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
    } catch (err) {
      console.error("Start over failed:", err)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="h-screen flex bg-surface-alt text-gray-900">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-30 p-2 bg-white border border-grid rounded-md"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-50 lg:z-auto w-64 h-full bg-white border-r border-grid flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-grid">
          <div className="flex items-center gap-2">
            <Image src="/icon-192.png" alt="Spun" width={22} height={22} />
            <span className="font-mono font-medium text-sm text-gray-900 tracking-tight">spun</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-surface-alt rounded-md"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Conversation list */}
        <SidebarConversations onCloseMobile={() => setSidebarOpen(false)} />

        {/* Footer */}
        <div className="border-t border-grid p-3 space-y-1">
          <button
            onClick={() => router.push("/brand-assets")}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-900 hover:bg-surface-alt rounded-md transition-all"
          >
            <Palette className="w-3.5 h-3.5" />
            Brand assets
          </button>
          <button
            onClick={() => router.push("/settings")}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-900 hover:bg-surface-alt rounded-md transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-red-600 hover:bg-surface-alt rounded-md transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Start over
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-900 hover:bg-surface-alt rounded-md transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface-alt">{children}</main>

      {/* Start Over confirmation dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white border border-grid rounded-md p-6 max-w-sm w-full space-y-4 shadow-lg">
            <h3 className="text-gray-900 font-semibold text-lg">Start over?</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              This will delete your business profile, conversations, and brand assets. Your connected channels (Meta, Google, etc.) will be kept.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 text-sm text-gray-700 border border-grid hover:border-gray-300 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartOver}
                disabled={resetting}
                className="flex-1 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
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
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:text-gray-900 hover:bg-surface-alt border border-grid rounded-md transition-all"
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
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-all text-left ${
              ctx?.activeConversationId === conv._id
                ? "bg-spun-50 text-spun border border-spun/20"
                : "text-gray-500 hover:text-gray-900 hover:bg-surface-alt"
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
