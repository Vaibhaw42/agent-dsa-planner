'use client'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface DifficultyPieChartProps {
  easy: number
  medium: number
  hard: number
  loading?: boolean
}

const COLORS = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' }

export function DifficultyPieChart({ easy, medium, hard, loading }: DifficultyPieChartProps) {
  if (loading) return <Skeleton className="h-64 w-full" />

  const data = [
    { name: 'Easy', value: easy },
    { name: 'Medium', value: medium },
    { name: 'Hard', value: hard },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">No data yet</div>
  }

  return (
    <ResponsiveContainer width="100%" height={256}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
