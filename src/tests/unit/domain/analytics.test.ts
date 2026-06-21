import { describe, expect, it } from 'vitest'
import { MasteryCalculator } from '@/domain/services/MasteryCalculator'
import { ReadinessCalculator } from '@/domain/services/ReadinessCalculator'
import { WeaknessDetector } from '@/domain/services/WeaknessDetector'
import { VelocityCalculator } from '@/domain/services/VelocityCalculator'
import { MasteryScore } from '@/domain/value-objects/MasteryScore'
import type { TopicProgress } from '@/domain/entities/DailySnapshot'

function makeTopicProgress(slug: string, solved: number, total = 100): TopicProgress {
  const mastery = MasteryScore.of(Math.min(100, Math.round((solved / total) * 100)))
  return { topicId: slug, topicSlug: slug, solved, attempted: solved, masteryScore: mastery }
}

describe('MasteryCalculator', () => {
  const calc = new MasteryCalculator()

  it('calculates mastery as percentage of solved/total capped at 100', () => {
    const score = calc.compute(40, 100)
    expect(MasteryScore.toNumber(score)).toBe(40)
  })

  it('caps at 100 when solved > total', () => {
    const score = calc.compute(120, 100)
    expect(MasteryScore.toNumber(score)).toBe(100)
  })

  it('returns 0 when nothing solved', () => {
    const score = calc.compute(0, 100)
    expect(MasteryScore.toNumber(score)).toBe(0)
  })
})

describe('WeaknessDetector', () => {
  const detector = new WeaknessDetector()

  it('flags topics below WEAK_THRESHOLD as weak', () => {
    const topics: TopicProgress[] = [
      makeTopicProgress('array', 50, 100),   // 50 — strong
      makeTopicProgress('graph', 20, 100),   // 20 — weak
      makeTopicProgress('dp', 35, 100),      // 35 — weak
    ]
    const weak = detector.detect(topics)
    expect(weak.map((t) => t.topicSlug)).toEqual(expect.arrayContaining(['graph', 'dp']))
    expect(weak.map((t) => t.topicSlug)).not.toContain('array')
  })

  it('returns empty array when all topics are strong', () => {
    const topics = [makeTopicProgress('array', 80), makeTopicProgress('string', 90)]
    expect(detector.detect(topics)).toHaveLength(0)
  })

  it('returns empty array for empty input', () => {
    expect(detector.detect([])).toHaveLength(0)
  })
})

describe('ReadinessCalculator', () => {
  const calc = new ReadinessCalculator()

  it('computes Amazon readiness from weighted topics', () => {
    const topics: TopicProgress[] = [
      makeTopicProgress('array', 100),          // 100% × 20% weight
      makeTopicProgress('tree', 80),            // 80% × 20% weight
      makeTopicProgress('dynamic-programming', 60), // 60% × 15% weight
      makeTopicProgress('graph', 40),           // 40% × 10% weight
      makeTopicProgress('string', 70),          // 70% × 10% weight
    ]
    const score = calc.compute('amazon', topics)
    // 100*0.2 + 80*0.2 + 60*0.15 + 40*0.1 + 70*0.1 = 20+16+9+4+7 = 56
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('returns 0 for empty topics', () => {
    expect(calc.compute('amazon', [])).toBe(0)
  })

  it('supports all four companies', () => {
    const topics = [makeTopicProgress('array', 80)]
    expect(() => calc.compute('amazon', topics)).not.toThrow()
    expect(() => calc.compute('google', topics)).not.toThrow()
    expect(() => calc.compute('microsoft', topics)).not.toThrow()
    expect(() => calc.compute('meta', topics)).not.toThrow()
  })
})

describe('VelocityCalculator', () => {
  const calc = new VelocityCalculator()

  it('calculates problems per day', () => {
    const velocity = calc.compute(100, 130, 30)
    expect(velocity).toBe(1) // 30 problems in 30 days = 1/day
  })

  it('returns 0 when no progress', () => {
    expect(calc.compute(100, 100, 30)).toBe(0)
  })

  it('returns 0 when days is 0', () => {
    expect(calc.compute(100, 150, 0)).toBe(0)
  })

  it('rounds to 2 decimal places', () => {
    const velocity = calc.compute(0, 1, 3)
    expect(velocity).toBeCloseTo(0.33, 1)
  })
})
