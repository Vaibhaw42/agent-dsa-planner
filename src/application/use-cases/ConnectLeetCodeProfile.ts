import { randomUUID } from 'crypto'
import { createLeetCodeProfile } from '@/domain/entities/LeetCodeProfile'
import type { ILeetCodeProfileRepository } from '@/domain/repositories/ILeetCodeProfileRepository'
import { AppError } from '@/shared/errors/AppError'
import type { LeetCodeGraphQLClient } from '@/infrastructure/leetcode/LeetCodeGraphQLClient'

export interface ConnectLeetCodeProfileInput {
  userId: string
  username: string
}

export interface ConnectLeetCodeProfileResult {
  profileId: string
  username: string
  isPublic: boolean
}

export class ConnectLeetCodeProfile {
  constructor(
    private readonly profileRepo: ILeetCodeProfileRepository,
    private readonly leetcodeClient: LeetCodeGraphQLClient,
  ) {}

  async execute(input: ConnectLeetCodeProfileInput): Promise<ConnectLeetCodeProfileResult> {
    const username = input.username.toLowerCase().trim()

    const existing = await this.profileRepo.findByUserId(input.userId as Parameters<typeof this.profileRepo.findByUserId>[0])
    if (existing) {
      throw AppError.validation('LeetCode profile already connected. Update instead.')
    }

    const stats = await this.leetcodeClient.getUserStats(username)
    if (!stats) {
      throw new AppError('LEETCODE_PRIVATE_PROFILE', `LeetCode username "${username}" not found or profile is private.`, 404)
    }

    const profile = createLeetCodeProfile({
      id: randomUUID(),
      userId: input.userId,
      username,
      isVerified: true,
      isPublic: true,
    })

    await this.profileRepo.save(profile)

    return { profileId: profile.id, username: profile.username, isPublic: profile.isPublic }
  }
}
