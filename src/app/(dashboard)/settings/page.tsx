'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ApiSuccess } from '@/shared/utils/api-response'

interface ConnectResult {
  profileId: string
  username: string
}

export default function SettingsPage() {
  const [username, setUsername] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setConnecting(true)
    setMessage(null)
    const res = await fetch('/api/leetcode/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
    const json = (await res.json()) as ApiSuccess<ConnectResult>
    if (json.success) {
      setMessage({ type: 'success', text: `Connected as ${json.data.username}` })
    } else {
      setMessage({ type: 'error', text: 'Failed to connect. Check username and try again.' })
    }
    setConnecting(false)
  }

  const handleSync = async () => {
    setSyncing(true)
    setMessage(null)
    const res = await fetch('/api/leetcode/sync', { method: 'POST' })
    if (res.ok) {
      setMessage({ type: 'success', text: 'Sync complete! Dashboard updated.' })
    } else {
      const json = (await res.json()) as { error?: { message?: string } }
      setMessage({ type: 'error', text: json.error?.message ?? 'Sync failed.' })
    }
    setSyncing(false)
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>LeetCode Profile</CardTitle>
          <CardDescription>Connect your LeetCode username to start tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleConnect} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="username" className="sr-only">Username</Label>
              <Input
                id="username"
                placeholder="LeetCode username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={connecting}>
              {connecting ? 'Connecting…' : 'Connect'}
            </Button>
          </form>
          <Button variant="outline" onClick={() => void handleSync()} disabled={syncing}>
            {syncing ? 'Syncing…' : 'Sync Now'}
          </Button>
          {message && (
            <p className={`text-sm ${message.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
              {message.text}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
