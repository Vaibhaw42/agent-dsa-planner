'use client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Recommendation } from '@/domain/entities/Recommendation'

interface RecommendationCardProps {
  recommendation: Recommendation
  onComplete?: (id: string) => void
}

const TYPE_COLORS = {
  topic: 'bg-blue-100 text-blue-800',
  problem: 'bg-green-100 text-green-800',
  pattern: 'bg-purple-100 text-purple-800',
  revision: 'bg-orange-100 text-orange-800',
}

export function RecommendationCard({ recommendation: rec, onComplete }: RecommendationCardProps) {
  return (
    <Card className={rec.isCompleted ? 'opacity-50' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium">{rec.title}</CardTitle>
          <Badge className={TYPE_COLORS[rec.type]}>{rec.type}</Badge>
        </div>
        <CardDescription className="text-xs">Priority {rec.priority}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{rec.description}</p>
        {rec.reasoning && (
          <div className="rounded-md bg-muted px-3 py-2 space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Why this?</p>
            <p className="text-xs text-foreground">{rec.reasoning}</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          {typeof rec.metadata?.leetcodeUrl === 'string' && (
            <a
              href={rec.metadata.leetcodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Practice on LeetCode →
            </a>
          )}
          {!rec.isCompleted && onComplete && (
            <Button size="sm" variant="outline" onClick={() => onComplete(rec.id)}>
              Mark done
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
