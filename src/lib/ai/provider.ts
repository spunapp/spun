export interface LLMMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface LLMTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export interface LLMResponse {
  content: string
  toolCalls?: {
    name: string
    input: Record<string, unknown>
    id: string
  }[]
  stopReason: string
}

export interface LLMProvider {
  generate(
    messages: LLMMessage[],
    options?: {
      system?: string
      tools?: LLMTool[]
      maxTokens?: number
      model?: string
    }
  ): Promise<LLMResponse>
}
