export interface AIOptions {
  model?: string
  maxTokens?: number
  systemPrompt?: string
}

export interface AIResponse {
  content: string
  promptTokens: number
  completionTokens: number
  model: string
}

export interface AIProvider {
  runPrompt(prompt: string, options?: AIOptions): Promise<AIResponse>
}
