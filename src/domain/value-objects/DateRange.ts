export interface DateRange {
  readonly from: Date
  readonly to: Date
}

export const DateRange = {
  of: (from: Date, to: Date): DateRange => {
    if (from > to) throw new Error('DateRange: from must be <= to')
    return { from, to }
  },
  lastDays: (n: number): DateRange => {
    const to = new Date()
    const from = new Date(to.getTime() - n * 24 * 60 * 60 * 1000)
    return { from, to }
  },
}
