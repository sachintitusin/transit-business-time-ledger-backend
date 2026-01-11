import { Request, Response, NextFunction } from 'express'
import { DomainError } from '../../../domain/shared/DomainError'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Domain-level errors → 400
  if (err instanceof DomainError) {
    return res.status(400).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? undefined,
      },
    })
  }

  // Unexpected errors → 500
  console.error('Unhandled error:', err)

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
    },
  })
}
