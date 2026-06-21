import { MasteryScore } from '../value-objects/MasteryScore'

export class MasteryCalculator {
  compute(solved: number, total: number): MasteryScore {
    if (total === 0) return MasteryScore.of(0)
    return MasteryScore.of(Math.min(100, Math.round((solved / total) * 100)))
  }
}
