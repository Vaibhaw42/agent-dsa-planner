'use client'
import { useQuery } from '@tanstack/react-query'
import type { AnalyticsResult } from '@/application/services/AnalyticsService'
import type { ApiSuccess } from '@/shared/utils/api-response'

async function fetchAnalytics(): Promise<AnalyticsResult> {
  const res = await fetch('/api/analytics')
  if (!res.ok) throw new Error('Failed to fetch analytics')
  const json = (await res.json()) as ApiSuccess<AnalyticsResult>
  return json.data
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    staleTime: 2 * 60 * 1000,
  })
}
