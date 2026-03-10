"use client"

interface QuickRepliesProps {
  replies: string[]
  onSelect: (reply: string) => void
}

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  if (replies.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {replies.map((reply) => (
        <button
          key={reply}
          onClick={() => onSelect(reply)}
          className="px-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-full text-slate-300 hover:bg-white/10 hover:text-white hover:border-purple-500/30 transition-all"
        >
          {reply}
        </button>
      ))}
    </div>
  )
}
