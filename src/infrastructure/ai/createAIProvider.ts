import type { AIProvider } from './AIProvider'
import { ClaudeCodeProvider } from './ClaudeCodeProvider'
import { MockAIProvider } from './MockAIProvider'

export function createAIProvider(): AIProvider {
  if (process.env['USE_MOCK_AI'] === 'true' || process.env['NODE_ENV'] === 'test') {
    return new MockAIProvider()
  }
  return new ClaudeCodeProvider()
}
