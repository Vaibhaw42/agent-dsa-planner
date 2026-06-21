import { execFile } from 'child_process'
import { promisify } from 'util'
import type { AIOptions, AIProvider, AIResponse } from './AIProvider'

const execFileAsync = promisify(execFile)

interface ClaudeJsonOutput {
  result: string
  usage?: {
    input_tokens: number
    output_tokens: number
  }
  modelUsage?: Record<string, { inputTokens: number; outputTokens: number }>
}

export class ClaudeCodeProvider implements AIProvider {
  async runPrompt(prompt: string, options?: AIOptions): Promise<AIResponse> {
    const model = options?.model ?? process.env['CLAUDE_MODEL'] ?? 'claude-sonnet-4-6'

    const args = [
      '--print', prompt,
      '--output-format', 'json',
      '--model', model,
    ]

    if (options?.systemPrompt) {
      args.push('--system-prompt', options.systemPrompt)
    }

    const claudePath = process.env['CLAUDE_PATH'] ?? 'claude'

    const { stdout } = await execFileAsync(claudePath, args, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120_000,
    })

    const parsed = JSON.parse(stdout.trim()) as ClaudeJsonOutput

    const modelEntry = parsed.modelUsage ? Object.entries(parsed.modelUsage)[0] : null
    const promptTokens = modelEntry?.[1]?.inputTokens ?? parsed.usage?.input_tokens ?? 0
    const completionTokens = modelEntry?.[1]?.outputTokens ?? parsed.usage?.output_tokens ?? 0

    return {
      content: parsed.result,
      promptTokens,
      completionTokens,
      model: modelEntry?.[0] ?? model,
    }
  }
}
