'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RecommendationCard } from '@/presentation/components/recommendations/RecommendationCard'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Recommendation } from '@/domain/entities/Recommendation'
import type { ApiSuccess } from '@/shared/utils/api-response'

async function fetchRecommendations(): Promise<Recommendation[]> {
  const res = await fetch('/api/recommendations')
  const json = (await res.json()) as ApiSuccess<Recommendation[]>
  return json.data
}

async function generateRecommendations(): Promise<Recommendation[]> {
  const res = await fetch('/api/recommendations', { method: 'POST' })
  const json = (await res.json()) as ApiSuccess<Recommendation[]>
  return json.data
}

export default function RecommendationsPage() {
  const queryClient = useQueryClient()
  const { data: recs, isLoading } = useQuery({
    queryKey: ['recommendations'],
    queryFn: fetchRecommendations,
  })

  const generateMutation = useMutation({
    mutationFn: generateRecommendations,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recommendations</h1>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? 'Generating…' : 'Generate New'}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (recs?.length ?? 0) === 0 ? (
        <p className="text-muted-foreground">No recommendations yet. Click Generate New to start.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {recs?.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  )
}
