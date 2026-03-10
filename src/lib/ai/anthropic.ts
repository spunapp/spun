import Anthropic from "@anthropic-ai/sdk"
import type { LLMMessage, LLMProvider, LLMResponse, LLMTool } from "./provider"

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic()
  }

  async generate(
    messages: LLMMessage[],
    options?: {
      system?: string
      tools?: LLMTool[]
      maxTokens?: number
      model?: string
    }
  ): Promise<LLMResponse> {
    const anthropicMessages: Anthropic.MessageParam[] = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))

    const response = await this.client.messages.create({
      model: options?.model ?? "claude-sonnet-4-5-20241022",
      max_tokens: options?.maxTokens ?? 4096,
      system: options?.system,
      tools: options?.tools as Anthropic.Tool[] | undefined,
      messages: anthropicMessages,
    })

    let content = ""
    const toolCalls: LLMResponse["toolCalls"] = []

    for (const block of response.content) {
      if (block.type === "text") {
        content += block.text
      } else if (block.type === "tool_use") {
        toolCalls.push({
          name: block.name,
          input: block.input as Record<string, unknown>,
          id: block.id,
        })
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      stopReason: response.stop_reason ?? "end_turn",
    }
  }
}
