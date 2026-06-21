import { UserId } from '../value-objects/UserId'

export interface LeetCodeProfile {
  readonly id: string
  readonly userId: UserId
  readonly username: string
  readonly isVerified: boolean
  readonly isPublic: boolean
  readonly createdAt: Date
  readonly lastSyncedAt: Date | null
}

export const createLeetCodeProfile = (params: {
  id: string
  userId: string
  username: string
  isVerified?: boolean
  isPublic?: boolean
  createdAt?: Date
  lastSyncedAt?: Date | null
}): LeetCodeProfile => ({
  id: params.id,
  userId: UserId.fromString(params.userId),
  username: params.username.toLowerCase().trim(),
  isVerified: params.isVerified ?? false,
  isPublic: params.isPublic ?? true,
  createdAt: params.createdAt ?? new Date(),
  lastSyncedAt: params.lastSyncedAt ?? null,
})
