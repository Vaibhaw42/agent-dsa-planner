import { randomUUID } from 'crypto'
import type { Recommendation } from '@/domain/entities/Recommendation'
import type { StudyPlan, StudyPlanItem } from '@/domain/entities/StudyPlan'
import { UserId } from '@/domain/value-objects/UserId'
import type { AnalyticsResult } from '@/application/services/AnalyticsService'
import { buildAnalyzeProgressPrompt } from './prompts/analyze-progress'
import { buildGenerateRecommendationsPrompt } from './prompts/generate-recommendations'
import { buildGenerateStudyPlanPrompt } from './prompts/generate-study-plan'
import type { AIProvider } from './AIProvider'

interface RecommendationRaw {
  type: 'topic' | 'problem' | 'pattern' | 'revision'
  title: string
  description: string
  reasoning: string
  leetcodeUrl?: string
  priority: number
}

interface StudyPlanItemRaw {
  day: number
  topicSlug: string | null
  title: string
  description: string
}

export class AIOrchestrationService {
  constructor(private readonly ai: AIProvider) {}

  async generateRecommendations(
    userId: string,
    analytics: AnalyticsResult,
  ): Promise<Recommendation[]> {
    const prompt = buildGenerateRecommendationsPrompt(analytics)
    const response = await this.ai.runPrompt(prompt)

    const parsed = this.parseJson<{ recommendations: RecommendationRaw[] }>(response.content)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return (parsed.recommendations ?? []).map((r) => ({
      id: randomUUID(),
      userId: UserId.fromString(userId),
      type: r.type,
      title: r.title,
      description: r.description,
      reasoning: r.reasoning,
      priority: r.priority,
      metadata: r.leetcodeUrl ? { leetcodeUrl: r.leetcodeUrl } : {},
      isCompleted: false,
      createdAt: now,
      expiresAt,
    }))
  }

  async generateStudyPlan(
    userId: string,
    analytics: AnalyticsResult,
    targetDays: number,
    targetCompany: string | null,
  ): Promise<StudyPlan> {
    const prompt = buildGenerateStudyPlanPrompt(analytics, targetDays, targetCompany)
    const response = await this.ai.runPrompt(prompt)

    const parsed = this.parseJson<{ title: string; items: StudyPlanItemRaw[] }>(response.content)
    const now = new Date()
    const targetDate = new Date(now.getTime() + targetDays * 24 * 60 * 60 * 1000)

    const items: StudyPlanItem[] = (parsed.items ?? []).map((item, index) => {
      const scheduledDate = new Date(now.getTime() + (item.day - 1) * 24 * 60 * 60 * 1000)
      return {
        id: randomUUID(),
        studyPlanId: '',
        topicSlug: item.topicSlug,
        problemSlug: null,
        title: item.title,
        description: item.description,
        orderIndex: index,
        isCompleted: false,
        scheduledDate,
        completedAt: null,
      }
    })

    const planId = randomUUID()
    const itemsWithPlanId = items.map((item) => ({ ...item, studyPlanId: planId }))

    return {
      id: planId,
      userId: UserId.fromString(userId),
      title: parsed.title ?? `${targetDays}-Day Study Plan`,
      targetCompany: targetCompany,
      targetDate,
      status: 'active',
      items: itemsWithPlanId,
      createdAt: now,
    }
  }

  async analyzeProgress(analytics: AnalyticsResult): Promise<string> {
    const prompt = buildAnalyzeProgressPrompt(analytics)
    const response = await this.ai.runPrompt(prompt)
    return response.content
  }

  private parseJson<T>(content: string): Partial<T> {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch?.[0]) return {}
    try {
      return JSON.parse(jsonMatch[0]) as T
    } catch {
      return {}
    }
  }
}
