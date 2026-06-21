'use client'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface CompanyScore {
  company: string
  score: number
}

interface CompanyReadinessBarProps {
  scores: CompanyScore[]
  loading?: boolean
}

export function CompanyReadinessBar({ scores, loading }: CompanyReadinessBarProps) {
  if (loading) return <Skeleton className="h-64 w-full" />

  const data = scores.map((s) => ({
    name: s.company.charAt(0).toUpperCase() + s.company.slice(1),
    score: s.score,
  }))

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
        <Tooltip formatter={(v) => [`${v}%`, 'Readiness']} />
        <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
