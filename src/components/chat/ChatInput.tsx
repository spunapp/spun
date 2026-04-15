"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowUp, Plus, Image, X } from "lucide-react"

interface PendingFile {
  file: File
  preview: string
}

interface ChatInputProps {
  onSend: (message: string, files?: File[]) => void | Promise<void>
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = "Talk to Spun...",
}: ChatInputProps) {
  const [input, setInput] = useState("")
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      const needsScroll = textareaRef.current.scrollHeight > 160
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
      textareaRef.current.style.overflowY = needsScroll ? "auto" : "hidden"
    }
  }, [input])

  // Clean up previews on unmount
  useEffect(() => {
    return () => {
      pendingFiles.forEach((pf) => URL.revokeObjectURL(pf.preview))
    }
  }, [pendingFiles])

  async function handleSubmit() {
    const trimmed = input.trim()
    if ((!trimmed && pendingFiles.length === 0) || disabled) return
    const filesToSend = pendingFiles.length > 0 ? pendingFiles.map((pf) => pf.file) : undefined
    const messageToSend = trimmed || "I've uploaded some images for you."
    // Snapshot the previews up front so we can revoke them on success without
    // racing against setPendingFiles.
    const previewsToRevoke = pendingFiles.map((pf) => pf.preview)
    try {
      await onSend(messageToSend, filesToSend)
    } catch {
      // onSend failed (e.g. Convex network error). Keep the input and files
      // so the user can retry without retyping.
      return
    }
    setInput("")
    previewsToRevoke.forEach((p) => URL.revokeObjectURL(p))
    setPendingFiles([])
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const newFiles: PendingFile[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith("image/")) {
        newFiles.push({ file, preview: URL.createObjectURL(file) })
      }
    }
    setPendingFiles((prev) => [...prev, ...newFiles])
    // Reset input so the same file can be selected again
    e.target.value = ""
  }

  function removeFile(index: number) {
    setPendingFiles((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  return (
    <div className="border-t border-white/5 px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {/* Pending file previews */}
        {pendingFiles.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {pendingFiles.map((pf, i) => (
              <div key={i} className="relative group">
                <img
                  src={pf.preview}
                  alt={pf.file.name}
                  className="w-16 h-16 object-cover rounded-lg border border-white/10"
                />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-stretch gap-2">
          {/* Plus button for file upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex-shrink-0 w-10 bg-white/5 hover:bg-white/15 rounded-xl flex items-center justify-center text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all outline-none focus:outline-none focus-visible:outline-none"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            title="Upload images"
          >
            <Plus className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="flex-1 px-4 py-3 bg-white/5 rounded-xl text-white placeholder-slate-500 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 resize-none disabled:opacity-50"
            style={{ border: '1px solid rgba(255,255,255,0.1)', overflowY: 'hidden', scrollbarWidth: 'none' }}
          />

          <button
            onClick={handleSubmit}
            disabled={(!input.trim() && pendingFiles.length === 0) || disabled}
            className="flex-shrink-0 w-10 bg-white/15 hover:bg-white/25 rounded-xl flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all outline-none focus:outline-none focus-visible:outline-none"
            style={{ border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
