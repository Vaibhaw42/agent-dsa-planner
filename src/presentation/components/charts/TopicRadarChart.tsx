'use client'
import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface TopicMastery {
  name: string
  masteryScore: number
}

interface TopicRadarChartProps {
  topics: TopicMastery[]
  loading?: boolean
}

export function TopicRadarChart({ topics, loading }: TopicRadarChartProps) {
  if (loading) return <Skeleton className="h-64 w-full" />

  const top10 = topics.slice(0, 10)

  if (top10.length === 0) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">No data yet</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={top10}>
        <PolarGrid />
        <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
        <Radar name="Mastery" dataKey="masteryScore" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
        <Tooltip formatter={(v) => [`${v}%`, 'Mastery']} />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  )
}
