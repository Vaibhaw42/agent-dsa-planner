import { getCurrentUser } from '@/shared/utils/get-current-user'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  return <DashboardClient email={user.email} />
}
