// Target problem counts per topic — the denominator MasteryCalculator uses
// to convert raw solve counts into a 0–100 mastery score. Tuned to reflect
// "good interview-prep coverage" rather than total LeetCode catalog size.

export const DEFAULT_TARGET_PROBLEMS = 50

export const TOPIC_TARGET_PROBLEMS: Record<string, number> = {
  array: 80,
  string: 60,
  'hash-table': 40,
  'linked-list': 30,
  stack: 30,
  queue: 20,
  tree: 60,
  'binary-tree': 50,
  'binary-search-tree': 30,
  graph: 60,
  trie: 20,
  heap: 30,
  matrix: 30,
  'dynamic-programming': 100,
  greedy: 40,
  backtracking: 30,
  sorting: 30,
  'binary-search': 40,
  'two-pointers': 30,
  'sliding-window': 25,
  'depth-first-search': 40,
  'breadth-first-search': 40,
  recursion: 30,
  'divide-and-conquer': 20,
  math: 40,
  'bit-manipulation': 25,
  'union-find': 20,
  'monotonic-stack': 15,
}

export function targetForTopic(slug: string): number {
  return TOPIC_TARGET_PROBLEMS[slug] ?? DEFAULT_TARGET_PROBLEMS
}
