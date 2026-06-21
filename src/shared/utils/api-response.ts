import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError } from '../errors/AppError'

export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: { total?: number; page?: number; limit?: number }
}

export interface ApiError {
  success: false
  error: { code: string; message: string }
}

export const apiOk = <T>(
  data: T,
  meta?: ApiSuccess<T>['meta'],
): NextResponse<ApiSuccess<T>> =>
  NextResponse.json({ success: true, data, ...(meta ? { meta } : {}) })

export const apiError = (err: unknown): NextResponse<ApiError> => {
  if (err instanceof AppError) {
    return NextResponse.json(
      { success: false, error: { code: err.code, message: err.message } },
      { status: err.statusCode },
    )
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: err.issues[0]?.message ?? 'Validation failed',
        },
      },
      { status: 400 },
    )
  }
  console.error('[API Error]', err)
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
    { status: 500 },
  )
}
