export class VelocityCalculator {
  /** Returns average problems solved per day over the given period. */
  compute(startTotal: number, endTotal: number, days: number): number {
    if (days === 0) return 0
    const delta = endTotal - startTotal
    if (delta <= 0) return 0
    return Math.round((delta / days) * 100) / 100
  }
}
