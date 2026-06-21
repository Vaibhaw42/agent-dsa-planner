import { randomUUID } from 'crypto'
import { z } from 'zod'
import type { Recommendation } from '@/domain/entities/Recommendation'
import type { StudyPlan, StudyPlanItem } from '@/domain/entities/StudyPlan'
import { UserId } from '@/domain/value-objects/UserId'
import type { AnalyticsResult } from '@/application/services/AnalyticsService'
import { AppError } from '@/shared/errors/AppError'
import { buildAnalyzeProgressPrompt } from './prompts/analyze-progress'
import { buildGenerateRecommendationsPrompt } from './prompts/generate-recommendations'
import { buildGenerateStudyPlanPrompt } from './prompts/generate-study-plan'
import type { AIProvider } from './AIProvider'

const RecommendationRawSchema = z.object({
  type: z.enum(['topic', 'problem', 'pattern', 'revision']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  reasoning: z.string().max(2000).default(''),
  leetcodeUrl: z
    .string()
    .url()
    .refine((u) => /^https?:\/\/(www\.)?leetcode\.com\//.test(u), 'must be a leetcode.com URL')
    .optional(),
  priority: z.number().int().min(1).max(5),
})

const RecommendationsResponseSchema = z.object({
  recommendations: z.array(RecommendationRawSchema).max(20),
})

const StudyPlanItemRawSchema = z.object({
  day: z.number().int().min(1).max(365),
  topicSlug: z.string().min(1).max(100).nullable(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
})

const StudyPlanResponseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  items: z.array(StudyPlanItemRawSchema).max(365),
})

export class AIOrchestrationService {
  constructor(private readonly ai: AIProvider) {}

  async generateRecommendations(
    userId: string,
    analytics: AnalyticsResult,
  ): Promise<Recommendation[]> {
    const prompt = buildGenerateRecommendationsPrompt(analytics)
    const response = await this.ai.runPrompt(prompt)

    const parsed = this.parseJson(response.content, RecommendationsResponseSchema, 'recommendations')
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    return parsed.recommendations.map((r) => ({
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

    const parsed = this.parseJson(response.content, StudyPlanResponseSchema, 'study-plan')
    const now = new Date()
    const targetDate = new Date(now.getTime() + targetDays * 24 * 60 * 60 * 1000)

    const planId = randomUUID()
    const items: StudyPlanItem[] = parsed.items
      .filter((item) => item.day <= targetDays)
      .map((item, index) => ({
        id: randomUUID(),
        studyPlanId: planId,
        topicSlug: item.topicSlug,
        problemSlug: null,
        title: item.title,
        description: item.description,
        orderIndex: index,
        isCompleted: false,
        scheduledDate: new Date(now.getTime() + (item.day - 1) * 24 * 60 * 60 * 1000),
        completedAt: null,
      }))

    return {
      id: planId,
      userId: UserId.fromString(userId),
      title: parsed.title ?? `${targetDays}-Day Study Plan`,
      targetCompany,
      targetDate,
      status: 'active',
      items,
      createdAt: now,
    }
  }

  async analyzeProgress(analytics: AnalyticsResult): Promise<string> {
    const prompt = buildAnalyzeProgressPrompt(analytics)
    const response = await this.ai.runPrompt(prompt)
    return response.content
  }

  private parseJson<T>(content: string, schema: z.ZodType<T>, label: string): T {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch?.[0]) {
      throw new AppError(
        'AI_PARSE_ERROR',
        `AI response for ${label} did not contain a JSON object.`,
        502,
      )
    }
    let raw: unknown
    try {
      raw = JSON.parse(jsonMatch[0])
    } catch (e) {
      throw new AppError(
        'AI_PARSE_ERROR',
        `AI response for ${label} is not valid JSON: ${(e as Error).message}`,
        502,
      )
    }
    const result = schema.safeParse(raw)
    if (!result.success) {
      throw new AppError(
        'AI_SCHEMA_ERROR',
        `AI response for ${label} failed schema validation: ${result.error.message}`,
        502,
      )
    }
    return result.data
  }
}
