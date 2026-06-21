import type { DailySnapshot } from '@/domain/entities/DailySnapshot'
import type { Company } from '@/domain/services/ReadinessCalculator'
import { MasteryCalculator } from '@/domain/services/MasteryCalculator'
import { ReadinessCalculator } from '@/domain/services/ReadinessCalculator'
import { VelocityCalculator } from '@/domain/services/VelocityCalculator'
import { WeaknessDetector } from '@/domain/services/WeaknessDetector'
import { MasteryScore } from '@/domain/value-objects/MasteryScore'

export interface DifficultyDistribution {
  easy: number
  medium: number
  hard: number
  total: number
}

export interface TopicMastery {
  slug: string
  name: string
  solved: number
  masteryScore: number
  isWeak: boolean
}

export interface CompanyReadiness {
  company: Company
  score: number
}

export interface AnalyticsResult {
  difficultyDistribution: DifficultyDistribution
  topicMasteries: TopicMastery[]
  weakTopics: TopicMastery[]
  strongTopics: TopicMastery[]
  companyReadiness: CompanyReadiness[]
  velocityPerDay: number
  latestSnapshot: DailySnapshot | null
}

const COMPANIES: Company[] = ['amazon', 'google', 'microsoft', 'meta']

export class AnalyticsService {
  private readonly masteryCalc = new MasteryCalculator()
  private readonly readinessCalc = new ReadinessCalculator()
  private readonly weaknessDetector = new WeaknessDetector()
  private readonly velocityCalc = new VelocityCalculator()

  compute(snapshots: DailySnapshot[]): AnalyticsResult {
    if (snapshots.length === 0) {
      return this.emptyResult()
    }

    const latest = snapshots[0]!
    const oldest = snapshots[snapshots.length - 1]!
    const days = Math.max(1, Math.round((latest.snapshotDate.getTime() - oldest.snapshotDate.getTime()) / 86_400_000))

    const topicMasteries: TopicMastery[] = latest.topicProgress.map((tp) => ({
      slug: tp.topicSlug,
      name: tp.topicSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      solved: tp.solved,
      masteryScore: MasteryScore.toNumber(tp.masteryScore),
      isWeak: MasteryScore.toNumber(tp.masteryScore) < MasteryScore.WEAK_THRESHOLD,
    }))

    const weakTopics = topicMasteries.filter((t) => t.isWeak)
    const strongTopics = topicMasteries.filter((t) => t.masteryScore >= MasteryScore.STRONG_THRESHOLD)

    const companyReadiness: CompanyReadiness[] = COMPANIES.map((company) => ({
      company,
      score: Math.round(this.readinessCalc.compute(company, latest.topicProgress)),
    }))

    const velocity = this.velocityCalc.compute(oldest.totalSolved, latest.totalSolved, days)

    return {
      difficultyDistribution: {
        easy: latest.easySolved,
        medium: latest.mediumSolved,
        hard: latest.hardSolved,
        total: latest.totalSolved,
      },
      topicMasteries,
      weakTopics,
      strongTopics,
      companyReadiness,
      velocityPerDay: velocity,
      latestSnapshot: latest,
    }
  }

  private emptyResult(): AnalyticsResult {
    return {
      difficultyDistribution: { easy: 0, medium: 0, hard: 0, total: 0 },
      topicMasteries: [],
      weakTopics: [],
      strongTopics: [],
      companyReadiness: COMPANIES.map((company) => ({ company, score: 0 })),
      velocityPerDay: 0,
      latestSnapshot: null,
    }
  }
}
