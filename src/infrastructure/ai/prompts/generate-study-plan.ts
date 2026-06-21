import type { AnalyticsResult } from '@/application/services/AnalyticsService'

export function buildGenerateStudyPlanPrompt(
  analytics: AnalyticsResult,
  targetDays: number,
  targetCompany: string | null,
): string {
  const { weakTopics, difficultyDistribution: diff, companyReadiness } = analytics

  const companyContext = targetCompany
    ? `Target company: ${targetCompany} (current readiness: ${companyReadiness.find((c) => c.company === targetCompany.toLowerCase())?.score ?? 0}%)`
    : 'No specific target company'

  return `You are a DSA coach. Create a ${targetDays}-day study plan as JSON.

## Developer Profile
- Total solved: ${diff.total}
- ${companyContext}
- Weak areas: ${weakTopics.map((t) => t.name).join(', ') || 'none'}

Create a structured plan. Each day should have 1-2 topics/patterns to practice.

Respond with ONLY valid JSON:
{
  "title": "plan title",
  "items": [
    {
      "day": 1,
      "topicSlug": "slug or null",
      "title": "what to practice",
      "description": "specific guidance"
    }
  ]
}`
}
