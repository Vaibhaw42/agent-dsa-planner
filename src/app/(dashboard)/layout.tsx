import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/shared/utils/get-current-user'
import { LogoutButton } from '@/presentation/components/LogoutButton'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let email = ''
  try {
    const user = await getCurrentUser()
    email = user.email
  } catch {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold tracking-tight">DSA Analyzer</span>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
          <Link href="/recommendations" className="text-sm text-muted-foreground hover:text-foreground">Recommendations</Link>
          <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">Settings</Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{email}</span>
          <LogoutButton />
        </div>
      </nav>
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
