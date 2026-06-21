import type { User } from '../entities/User'
import type { UserId } from '../value-objects/UserId'

export interface IUserRepository {
  findById(id: UserId): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<User>
}
