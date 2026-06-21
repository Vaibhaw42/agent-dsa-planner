import { UserId } from '../value-objects/UserId'

export interface User {
  readonly id: UserId
  readonly email: string
  readonly displayName: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
}

export const createUser = (params: {
  id: string
  email: string
  displayName?: string | null
  createdAt?: Date
  updatedAt?: Date
}): User => ({
  id: UserId.fromString(params.id),
  email: params.email,
  displayName: params.displayName ?? null,
  createdAt: params.createdAt ?? new Date(),
  updatedAt: params.updatedAt ?? new Date(),
})
