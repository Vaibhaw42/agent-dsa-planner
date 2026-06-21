'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loading}>
      {loading ? 'Signing out…' : 'Logout'}
    </Button>
  )
}
