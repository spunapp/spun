"use client"

import dynamic from "next/dynamic"
import ChatErrorBoundary from "./ChatErrorBoundary"

const ChatClient = dynamic(() => import("./ChatClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-spun border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

export default function ChatPage() {
  return (
    <ChatErrorBoundary>
      <ChatClient />
    </ChatErrorBoundary>
  )
}
