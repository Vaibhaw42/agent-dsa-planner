export type ErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'LEETCODE_FETCH_ERROR'
  | 'LEETCODE_PRIVATE_PROFILE'
  | 'SYNC_COOLDOWN_ACTIVE'
  | 'AI_PROVIDER_ERROR'
  | 'INTERNAL_ERROR'

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message)
    this.name = 'AppError'
  }

  static notFound(resource: string): AppError {
    return new AppError('NOT_FOUND', `${resource} not found`, 404)
  }

  static unauthorized(): AppError {
    return new AppError('UNAUTHORIZED', 'Authentication required', 401)
  }

  static forbidden(): AppError {
    return new AppError('FORBIDDEN', 'Access denied', 403)
  }

  static validation(message: string): AppError {
    return new AppError('VALIDATION_ERROR', message, 400)
  }
}
