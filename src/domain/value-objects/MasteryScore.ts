export type MasteryScore = number & { readonly _brand: 'MasteryScore' }

export const MasteryScore = {
  of: (value: number): MasteryScore => {
    if (value < 0 || value > 100) throw new Error(`MasteryScore must be 0-100, got ${value}`)
    return value as MasteryScore
  },
  toNumber: (score: MasteryScore): number => score,
  WEAK_THRESHOLD: 40 as const,
  STRONG_THRESHOLD: 75 as const,
}
