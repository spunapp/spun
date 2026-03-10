"use client"

import { MessageSquare, Plus } from "lucide-react"

interface Conversation {
  _id: string
  title?: string
  _creationTime: number
}

interface ConversationListProps {
  conversations: Conversation[]
  activeId?: string
  onSelect: (id: string) => void
  onNew: () => void
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          New conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {conversations.map((conv) => (
          <button
            key={conv._id}
            onClick={() => onSelect(conv._id)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all text-left ${
              activeId === conv._id
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {conv.title || "New conversation"}
            </span>
          </button>
        ))}

        {conversations.length === 0 && (
          <p className="text-xs text-slate-600 px-3 py-4">
            No conversations yet
          </p>
        )}
      </div>
    </div>
  )
}
