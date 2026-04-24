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
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 bg-white hover:bg-surface-alt border border-grid rounded-md transition-all"
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
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all text-left ${
              activeId === conv._id
                ? "bg-spun-50 text-spun border border-spun/20"
                : "text-gray-500 hover:text-gray-900 hover:bg-surface-alt"
            }`}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              {conv.title || "New conversation"}
            </span>
          </button>
        ))}

        {conversations.length === 0 && (
          <p className="text-xs text-gray-400 px-3 py-4">
            No conversations yet
          </p>
        )}
      </div>
    </div>
  )
}
