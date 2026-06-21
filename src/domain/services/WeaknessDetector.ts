import type { TopicProgress } from '../entities/DailySnapshot'
import { MasteryScore } from '../value-objects/MasteryScore'

export class WeaknessDetector {
  detect(topics: ReadonlyArray<TopicProgress>): TopicProgress[] {
    return topics.filter(
      (t) => MasteryScore.toNumber(t.masteryScore) < MasteryScore.WEAK_THRESHOLD,
    )
  }
}
