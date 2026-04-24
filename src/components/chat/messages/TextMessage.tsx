"use client"

import { renderContent } from "./renderContent"

interface TextMessageProps {
  content: string
  isUser: boolean
}

export function TextMessage({ content, isUser }: TextMessageProps) {
  return (
    <div className={`text-sm leading-relaxed ${isUser ? "text-white" : "text-gray-800"}`}>
      {isUser
        ? content.split("\n").map((line, i) => (
            <p key={i} className={line ? "" : "h-3"}>{line}</p>
          ))
        : renderContent(content)
      }
    </div>
  )
}
