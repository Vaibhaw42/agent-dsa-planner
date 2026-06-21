export type TopicCategory = 'data_structures' | 'algorithms' | 'math' | 'other'

export interface Topic {
  readonly id: string
  readonly name: string
  readonly slug: string
  readonly category: TopicCategory
}
