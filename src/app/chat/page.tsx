"use client"

import dynamic from "next/dynamic"

// Dynamically import the chat client to prevent SSR issues with Convex hooks
const ChatClient = dynamic(() => import("./ChatClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

export default function ChatPage() {
  return <ChatClient />
}
