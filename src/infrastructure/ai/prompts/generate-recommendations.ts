import type { AnalyticsResult } from '@/application/services/AnalyticsService'

export function buildGenerateRecommendationsPrompt(analytics: AnalyticsResult): string {
  const { weakTopics, strongTopics, difficultyDistribution: diff } = analytics

  return `You are a DSA coach. Generate 5 personalized study recommendations as JSON.

## Developer Profile
- Problems solved: ${diff.total} (${diff.easy} easy, ${diff.medium} medium, ${diff.hard} hard)
- Weak areas: ${weakTopics.map((t) => `${t.name} (${t.masteryScore}%)`).join(', ') || 'none'}
- Strong areas: ${strongTopics.map((t) => t.name).join(', ') || 'none'}

Rules:
- Base every recommendation on the exact weak/strong data above
- For "problem" type: pick a real LeetCode problem slug and set leetcodeUrl to https://leetcode.com/problems/{slug}/
- For "topic" type: set leetcodeUrl to https://leetcode.com/tag/{tag-slug}/
- For "pattern" or "revision" type: set leetcodeUrl to the most relevant tag URL
- reasoning must explain specifically why THIS item was chosen given the profile numbers above (e.g. "Trie is at 22% — lowest weak area")

Respond with ONLY valid JSON:
{
  "recommendations": [
    {
      "type": "topic" | "problem" | "pattern" | "revision",
      "title": "short action title",
      "description": "what to do and why",
      "reasoning": "specific reason this item was chosen based on the profile data",
      "leetcodeUrl": "https://leetcode.com/...",
      "priority": 1-5
    }
  ]
}`
}
