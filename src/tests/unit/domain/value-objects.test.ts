import { describe, expect, it } from 'vitest'
import { DateRange } from '@/domain/value-objects/DateRange'
import { MasteryScore } from '@/domain/value-objects/MasteryScore'
import { UserId } from '@/domain/value-objects/UserId'

describe('UserId', () => {
  it('creates from valid string', () => {
    const id = UserId.fromString('user-123')
    expect(UserId.toString(id)).toBe('user-123')
  })

  it('throws on empty string', () => {
    expect(() => UserId.fromString('')).toThrow('UserId cannot be empty')
  })

  it('throws on whitespace-only string', () => {
    expect(() => UserId.fromString('   ')).toThrow('UserId cannot be empty')
  })
})

describe('MasteryScore', () => {
  it('creates valid score at 0', () => {
    const score = MasteryScore.of(0)
    expect(MasteryScore.toNumber(score)).toBe(0)
  })

  it('creates valid score at 100', () => {
    const score = MasteryScore.of(100)
    expect(MasteryScore.toNumber(score)).toBe(100)
  })

  it('creates valid score at 75', () => {
    const score = MasteryScore.of(75)
    expect(MasteryScore.toNumber(score)).toBe(75)
  })

  it('throws below 0', () => {
    expect(() => MasteryScore.of(-1)).toThrow()
  })

  it('throws above 100', () => {
    expect(() => MasteryScore.of(101)).toThrow()
  })

  it('WEAK_THRESHOLD is 40', () => {
    expect(MasteryScore.WEAK_THRESHOLD).toBe(40)
  })

  it('STRONG_THRESHOLD is 75', () => {
    expect(MasteryScore.STRONG_THRESHOLD).toBe(75)
  })
})

describe('DateRange', () => {
  it('creates valid range', () => {
    const from = new Date('2024-01-01')
    const to = new Date('2024-01-31')
    const range = DateRange.of(from, to)
    expect(range.from).toEqual(from)
    expect(range.to).toEqual(to)
  })

  it('allows from === to (single day)', () => {
    const d = new Date('2024-06-01')
    const range = DateRange.of(d, d)
    expect(range.from).toEqual(d)
  })

  it('throws when from > to', () => {
    expect(() =>
      DateRange.of(new Date('2024-02-01'), new Date('2024-01-01')),
    ).toThrow('DateRange: from must be <= to')
  })

  it('lastDays creates range spanning N days', () => {
    const range = DateRange.lastDays(30)
    const diffMs = range.to.getTime() - range.from.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeCloseTo(30, 0)
  })
})
