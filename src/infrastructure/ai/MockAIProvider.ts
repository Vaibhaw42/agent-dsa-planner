import type { AIOptions, AIProvider, AIResponse } from './AIProvider'

export class MockAIProvider implements AIProvider {
  async runPrompt(prompt: string, options?: AIOptions): Promise<AIResponse> {
    const content = JSON.stringify({
      recommendations: [
        {
          type: 'topic',
          title: 'Practice Dynamic Programming',
          description: 'Focus on classic DP patterns: knapsack, LCS, coin change.',
          reasoning: 'Your DP mastery score is below 40%.',
          priority: 1,
        },
      ],
    })

    return {
      content,
      promptTokens: prompt.length,
      completionTokens: content.length,
      model: options?.model ?? 'mock',
    }
  }
}
