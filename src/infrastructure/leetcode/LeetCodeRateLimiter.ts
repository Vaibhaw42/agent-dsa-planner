export class LeetCodeRateLimiter {
  private readonly maxPerMinute: number
  private requestTimestamps: number[] = []

  constructor(maxPerMinute = 10) {
    this.maxPerMinute = maxPerMinute
  }

  async acquire(): Promise<void> {
    const now = Date.now()
    const oneMinuteAgo = now - 60_000
    this.requestTimestamps = this.requestTimestamps.filter((t) => t > oneMinuteAgo)

    if (this.requestTimestamps.length >= this.maxPerMinute) {
      const oldest = this.requestTimestamps[0]!
      const waitMs = oldest + 60_000 - now + 100
      await new Promise((resolve) => setTimeout(resolve, waitMs))
      return this.acquire()
    }

    this.requestTimestamps.push(now)
  }
}
