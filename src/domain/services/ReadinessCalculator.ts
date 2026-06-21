import type { TopicProgress } from '../entities/DailySnapshot'
import { MasteryScore } from '../value-objects/MasteryScore'

export type Company = 'amazon' | 'google' | 'microsoft' | 'meta'

const COMPANY_WEIGHTS: Record<Company, Record<string, number>> = {
  amazon: {
    array: 0.20,
    tree: 0.20,
    'dynamic-programming': 0.15,
    graph: 0.10,
    string: 0.10,
    'linked-list': 0.05,
  },
  google: {
    tree: 0.20,
    graph: 0.20,
    'dynamic-programming': 0.15,
    math: 0.10,
    string: 0.10,
    array: 0.10,
  },
  microsoft: {
    tree: 0.20,
    array: 0.20,
    string: 0.15,
    'dynamic-programming': 0.10,
    'linked-list': 0.10,
  },
  meta: {
    tree: 0.25,
    array: 0.20,
    'dynamic-programming': 0.15,
    string: 0.10,
    graph: 0.10,
  },
}

export class ReadinessCalculator {
  compute(company: Company, topics: ReadonlyArray<TopicProgress>): number {
    if (topics.length === 0) return 0

    const weights = COMPANY_WEIGHTS[company]
    const topicMap = new Map(topics.map((t) => [t.topicSlug, MasteryScore.toNumber(t.masteryScore)]))

    let score = 0
    let totalWeight = 0

    for (const [slug, weight] of Object.entries(weights)) {
      const mastery = topicMap.get(slug) ?? 0
      score += mastery * weight
      totalWeight += weight
    }

    if (totalWeight === 0) return 0
    return Math.round((score / totalWeight) * 100) / 100
  }
}
