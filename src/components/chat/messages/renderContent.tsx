import type { ReactNode } from "react"

function processInline(text: string): ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export function renderContent(content: string): ReactNode[] {
  return content.split("\n").map((line, i) => {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = processInline(headingMatch[2])
      if (level <= 2) return <p key={i} className="font-semibold text-white mt-2 mb-0.5">{text}</p>
      return <p key={i} className="font-medium text-white mt-1">{text}</p>
    }

    const bulletMatch = line.match(/^[*\-•]\s+(.+)/)
    if (bulletMatch) {
      return (
        <p key={i} className="flex gap-2">
          <span className="text-slate-500 select-none">•</span>
          <span>{processInline(bulletMatch[1])}</span>
        </p>
      )
    }

    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (numberedMatch) {
      return (
        <p key={i} className="flex gap-2">
          <span className="text-slate-500 select-none">{numberedMatch[1]}.</span>
          <span>{processInline(numberedMatch[2])}</span>
        </p>
      )
    }

    if (!line) return <p key={i} className="h-3" />

    return <p key={i}>{processInline(line)}</p>
  })
}
