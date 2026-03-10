// Model routing — use cheaper models for simple tasks, capable models for complex ones

export type TaskComplexity = "simple" | "standard" | "complex"

export const MODEL_MAP: Record<TaskComplexity, string> = {
  simple: "claude-haiku-4-5-20251001", // Copy variants, formatting, quick answers
  standard: "claude-sonnet-4-5-20241022", // Strategy, campaigns, analysis
  complex: "claude-opus-4-6", // Deep strategy, multi-step reasoning, orchestration
}

export function getModelForTask(task: string): string {
  const simpleTasks = [
    "copy_variant",
    "format",
    "summarize",
    "quick_answer",
    "status_check",
  ]
  const complexTasks = [
    "full_strategy",
    "market_analysis",
    "competitive_analysis",
    "attribution_modeling",
  ]

  if (simpleTasks.includes(task)) return MODEL_MAP.simple
  if (complexTasks.includes(task)) return MODEL_MAP.complex
  return MODEL_MAP.standard
}
