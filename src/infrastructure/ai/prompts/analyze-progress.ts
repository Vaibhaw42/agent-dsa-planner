import type { AnalyticsResult } from '@/application/services/AnalyticsService'

export function buildAnalyzeProgressPrompt(analytics: AnalyticsResult): string {
  const { difficultyDistribution: diff, weakTopics, strongTopics, velocityPerDay, companyReadiness } = analytics

  return `You are a DSA coach analyzing a developer's LeetCode progress. Provide a JSON analysis.

## Current Stats
- Total solved: ${diff.total} (Easy: ${diff.easy}, Medium: ${diff.medium}, Hard: ${diff.hard})
- Daily velocity: ${velocityPerDay} problems/day
- Weak topics (mastery < 40%): ${weakTopics.map((t) => t.name).join(', ') || 'none'}
- Strong topics (mastery ≥ 75%): ${strongTopics.map((t) => t.name).join(', ') || 'none'}
- Company readiness: ${companyReadiness.map((c) => `${c.company}: ${c.score}%`).join(', ')}

Respond with ONLY valid JSON:
{
  "summary": "2-3 sentence summary of current status",
  "primaryFocus": "the single most important area to focus on",
  "estimatedDaysToAmazonReady": number,
  "estimatedDaysToGoogleReady": number
}`
}
