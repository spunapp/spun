"use client"

interface TextMessageProps {
  content: string
  isUser: boolean
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export function TextMessage({ content, isUser }: TextMessageProps) {
  return (
    <div className={`text-sm leading-relaxed ${isUser ? "text-purple-100" : "text-slate-200"}`}>
      {content.split("\n").map((line, i) => (
        <p key={i} className={line ? "" : "h-3"}>
          {renderInlineBold(line)}
        </p>
      ))}
    </div>
  )
}
