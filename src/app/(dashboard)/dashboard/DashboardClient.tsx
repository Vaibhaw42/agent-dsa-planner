'use client'
import { useAnalytics } from '@/presentation/hooks/useAnalytics'
import { StatsCard } from '@/presentation/components/stats/StatsCard'
import { DifficultyPieChart } from '@/presentation/components/charts/DifficultyPieChart'
import { TopicRadarChart } from '@/presentation/components/charts/TopicRadarChart'
import { CompanyReadinessBar } from '@/presentation/components/charts/CompanyReadinessBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface DashboardClientProps {
  email: string
}

export function DashboardClient({ email }: DashboardClientProps) {
  const { data, isLoading, error } = useAnalytics()

  if (error) {
    return <p className="text-destructive">Failed to load analytics. Connect your LeetCode profile first.</p>
  }

  const dist = data?.difficultyDistribution
  const latest = data?.latestSnapshot

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {email}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatsCard
          title="Total Solved"
          value={dist?.total ?? 0}
          subtitle={`Easy ${dist?.easy ?? 0} · Med ${dist?.medium ?? 0} · Hard ${dist?.hard ?? 0}`}
          loading={isLoading}
        />
        <StatsCard
          title="Global Rank"
          value={latest?.ranking ? `#${latest.ranking.toLocaleString()}` : '—'}
          loading={isLoading}
        />
        <StatsCard
          title="Velocity"
          value={data ? `${data.velocityPerDay}/day` : '—'}
          subtitle="30-day average"
          loading={isLoading}
        />
        <StatsCard
          title="Weak Topics"
          value={data?.weakTopics.length ?? 0}
          subtitle="Need improvement"
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Difficulty Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <DifficultyPieChart
              easy={dist?.easy ?? 0}
              medium={dist?.medium ?? 0}
              hard={dist?.hard ?? 0}
              loading={isLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topic Mastery</CardTitle>
          </CardHeader>
          <CardContent>
            <TopicRadarChart topics={data?.topicMasteries ?? []} loading={isLoading} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Interview Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <CompanyReadinessBar scores={data?.companyReadiness ?? []} loading={isLoading} />
        </CardContent>
      </Card>

      {(data?.weakTopics.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Areas to Improve</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data?.weakTopics.map((t) => (
              <Badge key={t.slug} variant="destructive">
                {t.name} ({t.masteryScore}%)
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
