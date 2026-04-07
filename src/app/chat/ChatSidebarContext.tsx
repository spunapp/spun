"use client"

import { createContext, useContext } from "react"
import type { Id } from "../../../convex/_generated/dataModel"

interface ChatSidebarContextValue {
  conversations: Array<{ _id: string; title?: string; _creationTime: number }> | undefined
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
}

const ChatSidebarContext = createContext<ChatSidebarContextValue | null>(null)

export function ChatSidebarProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: ChatSidebarContextValue
}) {
  return (
    <ChatSidebarContext.Provider value={value}>
      {children}
    </ChatSidebarContext.Provider>
  )
}

export function useChatSidebar() {
  return useContext(ChatSidebarContext)
}
