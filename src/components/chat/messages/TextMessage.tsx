"use client"

interface TextMessageProps {
  content: string
  isUser: boolean
}

export function TextMessage({ content, isUser }: TextMessageProps) {
  return (
    <div className={`text-sm leading-relaxed ${isUser ? "text-purple-100" : "text-slate-200"}`}>
      {content.split("\n").map((line, i) => (
        <p key={i} className={line ? "" : "h-3"}>
          {line}
        </p>
      ))}
    </div>
  )
}
